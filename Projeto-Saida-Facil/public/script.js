const $=s=>document.querySelector(s);
const MOTIVOS={"Sair da escola":["Consulta médica","Compromisso familiar","Mal-estar","Outro"],"Sair e voltar":["Consulta médica rápida","Almoço em casa","Compromisso rápido","Outro"],"Ficar no contraturno":["Aula de reforço","Projeto escolar","Biblioteca / estudo","Treino esportivo"]};
let tipo="Sair da escola",user=null,cad=false,timer=null,token=sessionStorage.getItem("tk")||"";
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=d=>d.split("-").reverse().join("/");

// Fala com o servidor
async function api(url,method="GET",data){
  const r=await fetch(url,{method,headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:data?JSON.stringify(data):undefined});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.erro||"Erro de comunicação com o servidor.");
  return j;
}
function fillMot(){$("#mot").innerHTML=MOTIVOS[tipo].map(m=>`<option>${m}</option>`).join("");$("#rwrap").classList.toggle("hide",tipo!=="Sair e voltar");$("#hwrap").classList.toggle("hide",tipo==="Ficar no contraturno")}
function show(v){["pedido","hist"].forEach(x=>$("#v-"+x).classList.toggle("hide",x!==v));
  document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));if(v==="hist")render()}

async function render(){
  try{
    const f=user.role==="coord"?$("#filtro").value:"";
    const l=(await api("/api/pedidos")).filter(p=>!f||p.status===f);
    $("#lista").innerHTML=l.length?l.map(p=>`<div class="item"><div class="row"><b>${esc(p.tipo)}</b><span class="badge ${p.status}">${p.status}</span></div>
      ${user.role==="coord"?`<div><b>${esc(p.nome)}</b> <span class="mut">(matrícula ${esc(p.matricula)})</span></div>`:""}
      <div class="mut">${fmt(p.data)}${p.hora?" às "+esc(p.hora):""}${p.retorno?" · volta às "+esc(p.retorno):""} · ${esc(p.motivo)}</div>
      <div class="mut">Autorizado por: ${esc(p.resp)}</div>
      ${user.role==="coord"&&p.status==="Pendente"?`<div class="btns"><button class="b-ok" data-id="${p.id}" data-s="Aprovado">Aprovar</button><button class="b-no" data-id="${p.id}" data-s="Recusado">Recusar</button></div>`:""}</div>`).join(""):"<p>Nenhum pedido por aqui.</p>";
  }catch(e){if(/Sessão/.test(e.message))logout()}
}
function enter(u){
  user=u;$("#login").classList.add("hide");$("#app").classList.remove("hide");
  const c=u.role==="coord";
  $("#nome").textContent=u.nome;$("#mnum").textContent=c?"Painel da coordenação":"Matrícula "+u.matricula;
  $("#nav").classList.toggle("hide",c);$("#filtro").classList.toggle("hide",!c);$("#htit").textContent=c?"Pedidos dos alunos":"Meus pedidos";
  $("#data").value=new Date().toLocaleDateString("sv-SE");fillMot();show(c?"hist":"pedido");
  clearInterval(timer);if(c)timer=setInterval(render,10000); // atualiza sozinho a cada 10 s
}
function logout(){token="";user=null;sessionStorage.removeItem("tk");clearInterval(timer);$("#sen").value="";$("#app").classList.add("hide");$("#login").classList.remove("hide")}

$("#troca").onclick=()=>{cad=!cad;$("#nwrap").classList.toggle("hide",!cad);$("#entrar").textContent=cad?"Criar conta":"Entrar";
  $("#troca").textContent=cad?"Já tenho conta":"Criar conta de aluno";$("#ltxt").textContent=cad?"Crie sua conta de aluno.":"Entre com sua matrícula e senha."};
$("#entrar").onclick=async()=>{const e=$("#lerr");e.classList.add("hide");
  try{const r=cad?await api("/api/register","POST",{nome:$("#nom").value,matricula:$("#mat").value,senha:$("#sen").value})
    :await api("/api/login","POST",{matricula:$("#mat").value,senha:$("#sen").value});
    token=r.token;sessionStorage.setItem("tk",token);enter(r.user)}
  catch(x){e.textContent=x.message;e.classList.remove("hide")}};
$("#sair").onclick=logout;
$("#filtro").onchange=render;
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>show(b.dataset.v));
document.querySelectorAll(".opt").forEach(o=>o.onclick=()=>{document.querySelectorAll(".opt").forEach(x=>x.classList.remove("on"));o.classList.add("on");tipo=o.dataset.t;fillMot()});
$("#enviar").onclick=async()=>{const e=$("#perr");
  try{const obs=$("#obs").value.trim();
    await api("/api/pedidos","POST",{tipo,data:$("#data").value,hora:tipo==="Ficar no contraturno"?"":$("#hora").value,retorno:$("#hret").value,motivo:$("#mot").value+(obs?" – "+obs:""),resp:$("#resp").value});
    e.className="msg";e.textContent="Pedido enviado! Acompanhe a resposta em “Meus pedidos”.";$("#resp").value="";$("#obs").value=""}
  catch(x){e.className="msg err";e.textContent=x.message}};
$("#lista").onclick=async ev=>{const b=ev.target.closest("button[data-id]");if(!b)return;
  try{await api("/api/pedidos/"+b.dataset.id,"PATCH",{status:b.dataset.s});render()}catch(x){alert(x.message)}};

// Se já estava logado, volta direto
if(token)api("/api/me").then(enter).catch(logout);