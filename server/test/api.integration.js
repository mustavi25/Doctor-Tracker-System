/**
 * API integration test. Run against a running API on a FRESHLY SEEDED database:
 *   npm run seed && npm run dev      (terminal 1)
 *   npm run test:api                 (terminal 2)
 * It creates and deletes its own records, but expects the standard seed data (12 doctors).
 * Env: API_URL (default http://localhost:5000/api), ADMIN_EMAIL, ADMIN_PASSWORD.
 */
const B=process.env.API_URL||'http://localhost:5000/api'; let cookie='';
const EMAIL=process.env.ADMIN_EMAIL||'admin@doctortracker.com', PASSWORD=process.env.ADMIN_PASSWORD||'Admin@12345';
let pass=0, fail=0;
const ok=(name,cond,extra='')=>{ cond?pass++:fail++; console.log((cond?'PASS ':'FAIL ')+name+(cond?'':'  -> '+extra)); };
async function call(method,path,body,{auth=true}={}){
  const r=await fetch(B+path,{method,headers:{'content-type':'application/json',...(auth&&cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined});
  const sc=r.headers.get('set-cookie'); if(sc&&path.includes('login')) cookie=sc.split(';')[0];
  let j=null; try{ j=await r.json(); }catch{}; return {s:r.status,j,h:r.headers,sc};
}
(async()=>{
  let r=await call('GET','/doctors',null,{auth:false}); ok('unauthenticated -> 401',r.s===401);
  r=await call('POST','/auth/login',{email:'admin@doctortracker.com',password:'wrong'}); ok('wrong password -> 401',r.s===401&&r.j.message==='Invalid email or password');
  r=await call('POST','/auth/login',{email:'nobody@x.com',password:PASSWORD}); ok('unknown email same message',r.s===401&&r.j.message==='Invalid email or password');
  r=await call('POST','/auth/login',{email:EMAIL,password:PASSWORD});
  ok('login 200 + httpOnly cookie',r.s===200&&/HttpOnly/i.test(r.sc||'')&&/SameSite=Lax/i.test(r.sc||''),r.sc);
  ok('login never returns password',!JSON.stringify(r.j).includes('password'));
  r=await call('GET','/dashboard/stats?days=30'); const primed=r.j.totals.patients; const primedDocs=r.j.totals.doctors;
  r=await call('GET','/auth/me'); ok('/me returns user',r.s===200&&r.j.user.email===EMAIL);

  r=await call('GET','/doctors?limit=5&page=1'); ok('doctors list paginated',r.s===200&&r.j.data.length===5&&r.j.meta.total===12&&r.j.meta.totalPages===3,JSON.stringify(r.j.meta));
  ok('doctors carry patientCount',typeof r.j.data[0].patientCount==='number');
  const docs=r.j.data;
  r=await call('GET','/doctors?page=3&limit=5'); ok('last page has 2',r.j.data.length===2);
  r=await call('GET','/doctors?search=ayesha'); ok('search partial/case-insens',r.j.meta.total>=1&&r.j.data[0].name.toLowerCase().includes('ayesha'));
  r=await call('GET','/doctors?search='+encodeURIComponent('.*')); ok('regex metachars are escaped (no match-all)',r.j.meta.total===0,r.j.meta.total);
  r=await call('GET','/doctors?specialization=Cardiology'); ok('filter specialization',r.j.meta.total===2&&r.j.data.every(d=>d.specialization==='Cardiology'));
  r=await call('GET','/doctors?hospital=Square%20Hospital&specialization=Cardiology'); ok('combined filters',r.j.data.every(d=>d.hospital==='Square Hospital'&&d.specialization==='Cardiology'));
  const today=new Date().toISOString().slice(0,10);
  r=await call('GET',`/doctors?from=${today}&to=${today}`); ok('date filter (today, inclusive end of day) runs',r.s===200);
  r=await call('GET','/doctors?from=2020-01-01&to=2020-01-02'); ok('date filter excludes',r.j.meta.total===0);
  r=await call('GET','/doctors?sort=name_asc&limit=50'); const names=r.j.data.map(d=>d.name); ok('sort name_asc',JSON.stringify(names)===JSON.stringify([...names].sort((a,b)=>a<b?-1:1)));
  r=await call('GET','/doctors?limit=999'); ok('limit capped by validation -> 400',r.s===400);
  r=await call('GET','/doctors/filters'); ok('filter options',r.j.specializations.length>3&&r.j.hospitals.length>=3);
  r=await call('GET','/doctors/options'); ok('doctor options (id,name only)',r.j.data.length===12&&Object.keys(r.j.data[0]).sort().join()==='_id,name,specialization');

  const d=docs[0];
  r=await call('GET','/doctors/'+d._id); ok('doctor detail',r.s===200&&r.j.data._id===d._id&&r.j.data.patientCount===d.patientCount);
  r=await call('GET','/doctors/000000000000000000000000'); ok('unknown doctor 404',r.s===404);
  r=await call('GET','/doctors/not-an-id'); ok('bad id 400',r.s===400);

  r=await call('POST','/doctors',{name:'Dr. Test Person',specialization:'Oncology',hospital:'Test Hospital',phone:'+8801712345678',email:'TEST@Example.com '});
  ok('create doctor 201 (email normalised)',r.s===201&&r.j.data.email==='test@example.com',JSON.stringify(r.j)); const nd=r.j.data;
  r=await call('POST','/doctors',{name:'Dr. Dup',specialization:'Oncology',hospital:'X Hospital',phone:'+8801712345678',email:'test@example.com'});
  ok('duplicate email -> 409 with field error',r.s===409&&r.j.errors[0].field==='email',JSON.stringify(r.j));
  r=await call('POST','/doctors',{name:'D'}); ok('invalid body -> 400 with field list',r.s===400&&r.j.errors.length>=4);
  r=await call('POST','/doctors',{name:'Dr. Hack',specialization:'Oncology',hospital:'H H',phone:'+8801712345678',email:'h@x.com',role:'admin',_id:'x'}); ok('unknown fields stripped',r.s===201&&!('role' in r.j.data));
  const hack=r.j.data;
  r=await call('PUT','/doctors/'+nd._id,{hospital:'Updated Hospital'}); ok('partial update',r.s===200&&r.j.data.hospital==='Updated Hospital'&&r.j.data.name==='Dr. Test Person');
  r=await call('PUT','/doctors/'+nd._id,{}); ok('empty update rejected',r.s===400);

  r=await call('POST',`/doctors/${nd._id}/patients`,{name:'Rahim Khan',condition:'Asthma',age:34,gender:'male',phone:'+8801700000001'}); ok('add patient under doctor',r.s===201&&r.j.data.doctor===nd._id,JSON.stringify(r.j)); const p=r.j.data;
  r=await call('POST',`/doctors/${nd._id}/patients`,{name:'Sumaiya Begum',condition:'Diabetes'}); ok('add patient w/o optionals',r.s===201&&!('age' in r.j.data));
  r=await call('GET','/dashboard/stats?days=30'); ok('cache invalidated by writes: dashboard shows +2 patients, +2 doctors instantly',r.j.totals.patients===primed+2&&r.j.totals.doctors===primedDocs+2,JSON.stringify(r.j.totals));
  r=await call('POST',`/doctors/${nd._id}/patients`,{name:'Bad',condition:'X',age:999}); ok('invalid age rejected',r.s===400);
  r=await call('POST',`/doctors/000000000000000000000000/patients`,{name:'Ghost',condition:'Asthma'}); ok('patient for missing doctor 404',r.s===404);
  r=await call('GET',`/doctors/${nd._id}/patients`); ok('doctor patients list',r.j.meta.total===2);
  r=await call('GET',`/doctors/${nd._id}/patients?condition=Asthma`); ok('doctor patients filter',r.j.meta.total===1&&r.j.data[0].name==='Rahim Khan');
  r=await call('GET',`/doctors/${nd._id}/patients?search=sumaiya`); ok('doctor patients search',r.j.meta.total===1);

  r=await call('PUT','/patients/'+p._id,{age:null,phone:null,condition:'Migraine'}); ok('PUT null clears fields ($unset)',r.s===200&&!('age' in r.j.data)&&!('phone' in r.j.data)&&r.j.data.condition==='Migraine'&&r.j.data.gender==='male',JSON.stringify(r.j));
  r=await call('GET','/patients/'+p._id); ok('cleared fields really gone in DB',!('age' in r.j.data)&&!('phone' in r.j.data)&&r.j.data.doctor.name==='Dr. Test Person');
  r=await call('PUT','/patients/'+p._id,{doctor:docs[1]._id}); ok('reassign doctor',r.s===200&&r.j.data.doctor._id===docs[1]._id);
  r=await call('PUT','/patients/'+p._id,{doctor:'000000000000000000000000'}); ok('reassign to missing doctor 404',r.s===404);
  r=await call('PUT','/patients/'+p._id,{age:'12'}); ok('string age rejected on update',r.s===400);

  r=await call('GET','/patients?limit=10'); ok('patients list populated doctor',r.s===200&&r.j.data[0].doctor&&r.j.data[0].doctor.name&&r.j.meta.total>=150);
  r=await call('GET','/patients?doctor='+docs[1]._id+'&gender=male'); ok('patients doctor+gender filter',r.j.data.every(x=>x.doctor._id===docs[1]._id&&x.gender==='male'));
  r=await call('GET','/patients?search=zzzzzz'); ok('patients search none',r.j.meta.total===0&&r.j.meta.totalPages===1);
  r=await call('GET','/patients/conditions'); ok('conditions list',r.j.conditions.includes('Asthma'));

  r=await call('DELETE',`/doctors/${nd._id}/patients/${p._id}`); ok('delete patient of other doctor -> 404',r.s===404);
  r=await call('DELETE',`/doctors/${docs[1]._id}/patients/${p._id}`); ok('delete patient from doctor',r.s===200);
  r=await call('DELETE','/doctors/'+nd._id); ok('delete doctor cascades patients',r.s===200&&r.j.patientsDeleted===1,JSON.stringify(r.j));
  await call('DELETE','/doctors/'+hack._id);
  r=await call('GET','/patients?limit=1'); const before=r.j.meta.total;

  r=await call('GET','/dashboard/stats?days=30'); const s=r.j;
  ok('dashboard totals',r.s===200&&s.totals.doctors===12&&s.totals.patients===before,JSON.stringify(s.totals));
  ok('patientsPerDoctor top<=10, sorted, joined name',s.patientsPerDoctor.length>0&&s.patientsPerDoctor.length<=10&&s.patientsPerDoctor.every((x,i,a)=>!i||a[i-1].count>=x.count)&&!!s.patientsPerDoctor[0].name);
  ok('time series is continuous (30 days, zero-filled)',s.patientsOverTime.length===30&&new Set(s.patientsOverTime.map(x=>x.date)).size===30);
  ok('sum of series <= total patients',s.patientsOverTime.reduce((a,b)=>a+b.count,0)<=s.totals.patients);
  ok('condition breakdown & specialization',s.conditionBreakdown.length>0&&s.doctorsBySpecialization.length>0);
  ok('avg per doctor',s.totals.avgPatientsPerDoctor===+(s.totals.patients/12).toFixed(1));
  r=await call('GET','/dashboard/stats?days=7'); ok('range 7',r.j.patientsOverTime.length===7);
  r=await call('GET','/dashboard/stats?days=2'); ok('range below min -> 400',r.s===400);

  r=await call('POST','/auth/logout'); ok('logout clears cookie',r.s===200&&/token=;/.test(r.sc||'')); 
  r=await call('GET','/doctors',null,{auth:false}); ok('after logout 401',r.s===401);
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
})();
