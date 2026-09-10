import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHmac} from 'node:crypto';
import {handle} from '../server/payment.js';

function setup(overrides={}) {
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_orders.sql',import.meta.url),'utf8'));
  const prepare=sql=>({bind(...args){return {first:async()=>sqlite.prepare(sql).get(...args)||null,run:async()=>sqlite.prepare(sql).run(...args),_run:()=>sqlite.prepare(sql).run(...args)};}});
  const DB={prepare,async batch(stmts){sqlite.exec('BEGIN');try{const r=stmts.map(s=>s._run());sqlite.exec('COMMIT');return r;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
  const env={DB,PRODUCTS:{head:async()=>({size:1}),get:async()=>({body:'private file'})},STARTER_ASSET_KEY:'private/starter.zip',CHECKOUT_ENABLED:'true',IMPLEMENTATION_ENABLED:'true',PUBLIC_ORIGIN:'https://shop.example',BANK_ACCOUNT:'123456789',BANK_CODE:'BIDV',BANK_ACCOUNT_NAME:'Test merchant',SEPAY_WEBHOOK_API_KEY:'test-only-webhook-key-not-real-000',RATE_LIMIT_SALT:'test-only-rate-key-not-real-000',...overrides};
  const call=(path,init={})=>handle(new Request('https://shop.example'+path,init),env);
  async function create(sku='starter'){
    const response=await call('/api/order?sku='+sku,{method:'POST',headers:{Origin:env.PUBLIC_ORIGIN},body:JSON.stringify({amount:1})});
    assert.equal(response.status,201);
    return {order:await response.json(),cookie:response.headers.get('Set-Cookie').split(';')[0]};
  }
  const payload=order=>({id:1001,gateway:'BIDV',accountNumber:'123456789',transferType:'in',transferAmount:order.amount,content:order.code,code:order.code});
  const hook=(data,key=env.SEPAY_WEBHOOK_API_KEY)=>call('/api/sepay',{method:'POST',headers:{Authorization:'Apikey '+key},body:JSON.stringify(data)});
  const hmacHook=(data,secret=env.SEPAY_WEBHOOK_SECRET)=>{
    const raw=JSON.stringify(data), timestamp=String(Math.floor(Date.now()/1000));
    const signature='sha256='+createHmac('sha256',secret).update(`${timestamp}.${raw}`).digest('hex');
    return call('/api/sepay',{method:'POST',headers:{'X-SePay-Timestamp':timestamp,'X-SePay-Signature':signature},body:raw});
  };
  return {env,sqlite,call,create,payload,hook,hmacHook};
}
test('checkout disabled until configured; arbitrary product rejected',async()=>{
  const s=setup({CHECKOUT_ENABLED:'false'});
  assert.equal((await s.call('/api/config').then(r=>r.json())).enabled,false);
  assert.equal((await s.call('/api/order',{method:'POST'})).status,503);
  assert.equal((await s.call('/api/config?sku=unknown')).status,400);
});
test('server fixes price and origin; unpaid download denied; authenticated exact payment unlocks file',async()=>{
  const s=setup();
  assert.equal((await s.call('/api/order',{method:'POST',headers:{Origin:'https://evil.example'}})).status,403);
  const {order,cookie}=await s.create();assert.equal(order.amount,500000);
  assert.equal((await s.call('/api/download',{headers:{Cookie:cookie}})).status,403);
  assert.equal((await s.hook(s.payload(order),'wrong')).status,401);
  assert.equal((await s.hook(s.payload(order))).status,200);
  const result=await s.call('/api/order',{headers:{Cookie:cookie}}).then(r=>r.json());assert.equal(result.status,'paid');
  const download=await s.call('/api/download',{headers:{Cookie:cookie}});assert.equal(download.status,200);assert.equal(await download.text(),'private file');
  assert.equal(download.headers.get('Cache-Control'),'no-store');
  assert.equal((await s.call('/api/download')).status,403);
});
test('HMAC-SHA256 verifies the raw body and blocks tampered or replayed webhooks',async()=>{
  const s=setup({SEPAY_WEBHOOK_SECRET:'test-only-hmac-secret-not-real-000'});
  const {order,cookie}=await s.create();
  assert.equal((await s.hmacHook(s.payload(order))).status,200);
  assert.equal((await s.call('/api/download',{headers:{Cookie:cookie}})).status,200);
  const {order:second}=await s.create('implementation');
  const raw=JSON.stringify(s.payload(second));
  const stale='1';
  const signature='sha256='+createHmac('sha256',s.env.SEPAY_WEBHOOK_SECRET).update(`${stale}.${raw}`).digest('hex');
  assert.equal((await s.call('/api/sepay',{method:'POST',headers:{'X-SePay-Timestamp':stale,'X-SePay-Signature':signature},body:raw})).status,401);
});
test('service price is 7.8m; payment never grants digital download; per-product cookies',async()=>{
  const s=setup();const {order,cookie}=await s.create('implementation');assert.equal(order.amount,7800000);
  await s.hook(s.payload(order));
  const result=await s.call('/api/order?sku=implementation',{headers:{Cookie:cookie}}).then(r=>r.json());assert.equal(result.status,'paid');assert.equal(result.downloadUrl,null);
  assert.equal((await s.call('/api/download?sku=implementation',{headers:{Cookie:cookie}})).status,403);
  assert.equal((await s.call('/api/order?sku=starter',{headers:{Cookie:cookie}})).status,404);
});
test('duplicate transaction cannot credit a second order even with a different code',async()=>{
  const s=setup();const a=await s.create();const b=await s.create();
  await s.hook(s.payload(a.order));await s.hook(s.payload(a.order));await s.hook(s.payload(b.order));
  assert.equal(s.sqlite.prepare('SELECT count(*) AS n FROM payment_events').get().n,1);
  assert.equal(s.sqlite.prepare('SELECT status FROM orders WHERE code=?').get(b.order.code).status,'pending');
});
for(const [name,modify] of Object.entries({outgoing:p=>({...p,transferType:'out'}),wrongAccount:p=>({...p,accountNumber:'99999999'}),wrongBank:p=>({...p,gateway:'ACB'}),underpaid:p=>({...p,transferAmount:1}),overpaid:p=>({...p,transferAmount:p.transferAmount+1}),ambiguous:p=>({...p,content:p.code+' OPC0123456789ABCDEF'})})){
  test(name+' cannot unlock order',async()=>{const s=setup();const {order,cookie}=await s.create();await s.hook(modify(s.payload(order)));assert.equal((await s.call('/api/download',{headers:{Cookie:cookie}})).status,403);});
}
test('late transfer recorded for review; refunded order loses access',async()=>{
  const s=setup();const {order,cookie}=await s.create();s.sqlite.prepare('UPDATE orders SET expires_at=1 WHERE code=?').run(order.code);
  await s.hook(s.payload(order));assert.equal(s.sqlite.prepare('SELECT outcome FROM payment_events').get().outcome,'review');
  assert.equal((await s.call('/api/download',{headers:{Cookie:cookie}})).status,403);
  s.sqlite.prepare("UPDATE orders SET status='refunded' WHERE code=?").run(order.code);
  assert.equal((await s.call('/api/download',{headers:{Cookie:cookie}})).status,403);
});
test('missing deliverable prevents creating starter order; invalid payload rejected',async()=>{
  const s=setup({PRODUCTS:{head:async()=>null}});
  assert.equal((await s.call('/api/order',{method:'POST',headers:{Origin:s.env.PUBLIC_ORIGIN}})).status,503);
  assert.equal((await s.hook({id:1})).status,400);
});
test('rate limit caps new orders',async()=>{const s=setup();for(let i=0;i<5;i++)await s.create();assert.equal((await s.call('/api/order',{method:'POST',headers:{Origin:s.env.PUBLIC_ORIGIN}})).status,429);});
test('SQL batch failure rolls back both receipt and payment update',async()=>{
  const s=setup();const {order}=await s.create();s.sqlite.exec("CREATE TRIGGER fail_paid BEFORE UPDATE ON orders BEGIN SELECT RAISE(ABORT,'test failure'); END");
  assert.equal((await s.hook(s.payload(order))).status,503);
  assert.equal(s.sqlite.prepare('SELECT count(*) AS n FROM payment_events').get().n,0);
});
test('lead capture stores customer name, email, phone and generates DH prefix order code',async()=>{
  const s=setup();
  const res=await s.call('/api/order?sku=starter',{
    method:'POST',
    headers:{Origin:s.env.PUBLIC_ORIGIN},
    body:JSON.stringify({name:'Trần Ngọc Chuyên',email:'chuyen@opc.com',phone:'0989890022'})
  });
  assert.equal(res.status,201);
  const order=await res.json();
  assert.match(order.code,/^DH\d{6}$/);
  assert.equal(order.customerName,'Trần Ngọc Chuyên');
  assert.equal(order.email,'chuyen@opc.com');
  assert.equal(order.phone,'0989890022');
  const dbRecord=s.sqlite.prepare('SELECT * FROM orders WHERE code=?').get(order.code);
  assert.equal(dbRecord.customer_name,'Trần Ngọc Chuyên');
  assert.equal(dbRecord.email,'chuyen@opc.com');
  assert.equal(dbRecord.phone,'0989890022');
});
test('order bump calculates 750k and unlocks download and vip links upon payment',async()=>{
  const s=setup();
  const res=await s.call('/api/order?sku=starter',{
    method:'POST',
    headers:{Origin:s.env.PUBLIC_ORIGIN},
    body:JSON.stringify({name:'Vip Buyer',email:'vip@opc.com',phone:'0912345678',bump:true})
  });
  assert.equal(res.status,201);
  const order=await res.json();
  const cookie=res.headers.get('Set-Cookie').split(';')[0];
  assert.equal(order.amount,750000);
  assert.equal(order.bump,true);
  await s.hook(s.payload(order));
  const paidRes=await s.call('/api/order?sku=starter',{headers:{Cookie:cookie}}).then(r=>r.json());
  assert.equal(paidRes.status,'paid');
  assert.ok(paidRes.downloadUrl);
  assert.ok(paidRes.driveVipLink);
  assert.ok(paidRes.zaloVipGroup);
});

