// Servidor do Saída Fácil – usa só módulos do próprio Node.js (não precisa de npm install)
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),os=require('os');
const PORT=process.env.PORT||3000,DB=path.join(__dirname,'data.json'),PUB=path.join(__dirname,'public');
const hash=(s,salt)=>crypto.scryptSync(s,salt,32).toString('hex');
const save=()=>fs.writeFileSync(DB,JSON.stringify(db,null,2));
let db;
try{db=JSON.parse(fs.readFileSync(DB,'utf8'))}catch(e){
  const salt=crypto.randomBytes(8).toString('hex');
  // Conta inicial da coordenação (troque a senha 'coord123' antes de criar o data.json)
  db={users:[{matricula:'coord',nome:'Coordenação',role:'coord',salt,hash:hash('coord123',salt)}],pedidos:[],nextId:1};
  save();
}
const sessions=new Map();
const TIPOS=['Sair da escola','Sair e voltar','Ficar no contraturno'];
const send=(res,code,obj)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(obj))};
const body=req=>new Promise((ok,no)=>{let d='';req.on('data',c=>{d+=c;if(d.length>20000){req.destroy();no()}});req.on('end',()=>{try{ok(JSON.parse(d||'{}'))}catch(e){no(e)}})});
const pub=u=>({matricula:u.matricula,nome:u.nome,role:u.role});
const entrar=(res,u)=>{const t=crypto.randomBytes(24).toString('hex');sessions.set(t,u.matricula);send(res,200,{token:t,user:pub(u)})};
const txt=(v,n=200)=>String(v||'').trim().slice(0,n);
const TIPO_MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript'};

http.createServer(async(req,res)=>{
  const p=new URL(req.url,'http://x').pathname;
  if(!p.startsWith('/api/')){
    const f=path.join(PUB,p==='/'?'index.html':p);
    if(!f.startsWith(PUB)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('Não encontrado')}
    res.writeHead(200,{'Content-Type':(TIPO_MIME[path.extname(f)]||'application/octet-stream')+'; charset=utf-8'});
    return fs.createReadStream(f).pipe(res);
  }
  try{
    const b=req.method==='GET'?{}:await body(req);
    if(p==='/api/register'){
      const m=txt(b.matricula,20),n=txt(b.nome,80),s=String(b.senha||'');
      if(!/^\w{3,20}$/.test(m)||n.length<2||s.length<4)return send(res,400,{erro:'Preencha nome, matrícula (3+ letras/números) e senha (4+ caracteres).'});
      if(db.users.some(x=>x.matricula===m))return send(res,400,{erro:'Essa matrícula já tem conta.'});
      const salt=crypto.randomBytes(8).toString('hex'),u={matricula:m,nome:n,role:'aluno',salt,hash:hash(s,salt)};
      db.users.push(u);save();return entrar(res,u);
    }
    if(p==='/api/login'){
      const u=db.users.find(x=>x.matricula===txt(b.matricula,20));
      if(!u||hash(String(b.senha||''),u.salt)!==u.hash)return send(res,401,{erro:'Matrícula ou senha incorretas.'});
      return entrar(res,u);
    }
    const me=db.users.find(x=>x.matricula===sessions.get((req.headers.authorization||'').slice(7)));
    if(!me)return send(res,401,{erro:'Sessão expirada. Entre novamente.'});
    if(p==='/api/me')return send(res,200,pub(me));
    if(p==='/api/pedidos'&&req.method==='GET')
      return send(res,200,db.pedidos.filter(x=>me.role==='coord'||x.matricula===me.matricula).slice().reverse());
    if(p==='/api/pedidos'&&req.method==='POST'){
      if(me.role!=='aluno')return send(res,403,{erro:'Só alunos fazem pedidos.'});
      const t=b.tipo,d=txt(b.data,10),h=txt(b.hora,5),r=txt(b.resp,80),rt=txt(b.retorno,5);
      const ficar=t==='Ficar no contraturno';
      if(!TIPOS.includes(t)||!d||(!ficar&&!h)||!r)return send(res,400,{erro:'Preencha data, horário e responsável.'});
      if(t==='Sair e voltar'&&(!rt||rt<=h))return send(res,400,{erro:'O horário de retorno deve ser depois da saída.'});
      const ped={id:db.nextId++,matricula:me.matricula,nome:me.nome,tipo:t,data:d,hora:ficar?'':h,retorno:t==='Sair e voltar'?rt:'',motivo:txt(b.motivo),resp:r,status:'Pendente',criado:new Date().toISOString()};
      db.pedidos.push(ped);save();return send(res,201,ped);
    }
    const m=p.match(/^\/api\/pedidos\/(\d+)$/);
    if(m&&req.method==='PATCH'){
      if(me.role!=='coord')return send(res,403,{erro:'Só a coordenação decide pedidos.'});
      const ped=db.pedidos.find(x=>x.id==m[1]);
      if(!ped)return send(res,404,{erro:'Pedido não encontrado.'});
      if(!['Aprovado','Recusado'].includes(b.status))return send(res,400,{erro:'Status inválido.'});
      ped.status=b.status;ped.decidido=new Date().toISOString();save();return send(res,200,ped);
    }
    send(res,404,{erro:'Rota não encontrada.'});
  }catch(e){send(res,400,{erro:'Requisição inválida.'})}
}).listen(PORT,'0.0.0.0',()=>{
  console.log('Saída Fácil rodando!\n  Neste computador: http://localhost:'+PORT);
  for(const l of Object.values(os.networkInterfaces()))for(const i of l)if(i.family==='IPv4'&&!i.internal)console.log('  Na rede (outros aparelhos): http://'+i.address+':'+PORT);
});