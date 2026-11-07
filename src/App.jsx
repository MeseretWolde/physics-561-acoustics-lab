import React,{useMemo,useRef,useState}from"react";
import{Waves,FlaskConical,AudioLines,Moon,Sun,Download,Plus,Trash2,RotateCcw,ImageDown}from"lucide-react";
import{Line}from"react-chartjs-2";
import{Chart as ChartJS,LinearScale,PointElement,LineElement,Tooltip,Legend,Title}from"chart.js";
ChartJS.register(LinearScale,PointElement,LineElement,Tooltip,Legend,Title);

const DEFAULT_DATA=[[0,93.75],[100,117.19],[200,140.62],[300,164.06],[400,187.50],[600,210.94]];
const PIPE_LENGTHS=[0.43,0.80,0.91,0.99,1.10,1.20,1.30,1.40];
const num=(v,f=0)=>Number.isFinite(v)?v.toFixed(f):"—";
const sci=v=>Number.isFinite(v)?v.toExponential(4):"—";

function linearFit(points){
 const n=points.length;if(n<2)return{m:NaN,b:NaN,r2:NaN};
 const sx=points.reduce((s,p)=>s+p.x,0),sy=points.reduce((s,p)=>s+p.y,0);
 const sxx=points.reduce((s,p)=>s+p.x*p.x,0),sxy=points.reduce((s,p)=>s+p.x*p.y,0);
 const den=n*sxx-sx*sx;if(!den)return{m:NaN,b:NaN,r2:NaN};
 const m=(n*sxy-sx*sy)/den,b=(sy-m*sx)/n,mean=sy/n;
 const ssRes=points.reduce((s,p)=>s+(p.y-(m*p.x+b))**2,0),ssTot=points.reduce((s,p)=>s+(p.y-mean)**2,0);
 return{m,b,r2:ssTot?1-ssRes/ssTot:1};
}
const Card=({children,className=""})=><section className={"card "+className}>{children}</section>;
export default function App(){
 const[tab,setTab]=useState("helm"),[dark,setDark]=useState(()=>localStorage.getItem("phys561-dark")==="1");
 const toggle=()=>setDark(v=>{localStorage.setItem("phys561-dark",v?"0":"1");return!v});
 return <div className={dark?"app dark":"app"}><header><div className="brand"><Waves/><div><h1>PHYS 561 Acoustics Lab</h1><p>Helmholtz resonator & ESC pipe resonance analysis</p></div></div><button className="icon" onClick={toggle} aria-label="Toggle dark mode">{dark?<Sun/>:<Moon/>}</button></header><nav><button className={tab==="helm"?"active":""} onClick={()=>setTab("helm")}><FlaskConical/>Helmholtz Resonator</button><button className={tab==="pipe"?"active":""} onClick={()=>setTab("pipe")}><AudioLines/>ESC Pipes</button></nav><main>{tab==="helm"?<Helmholtz/>:<Pipes/>}</main></div>
}
function Helmholtz(){
 const[d,setD]=useState(18),[neckCm,setNeckCm]=useState(12),[c0,setC0]=useState(343),[rho,setRho]=useState(1.01),[rated,setRated]=useState(828);
 const[rows,setRows]=useState(DEFAULT_DATA.map((r,i)=>({id:i+1,v:r[0],f:r[1]})));const chartRef=useRef();
 const calc=useMemo(()=>{
  const a=d/2000,A=Math.PI*a*a,pref=c0*c0*A/(4*Math.PI*Math.PI);
  const data=rows.map(r=>{const f=+r.f,v=+r.v,T=f>0?1/f:NaN,y=f>0?pref/(f*f):NaN;return{...r,v,f,T,y}}).filter(r=>Number.isFinite(r.v)&&Number.isFinite(r.y));
  const fit=linearFit(data.map(r=>({x:r.v,y:r.y})));
  // x is plotted in mL. Since 1 mL = 1e-6 m^3, slope in SI is m_mL * 1e6 and has units of metres.
  const dxEff=-fit.m*1e6,v0mL=-fit.b/fit.m,delta=dxEff-neckCm/100,alpha=delta/a,pct=Math.abs(v0mL-rated)/rated*100;
  return{a,A,pref,data,fit,dxEff,v0mL,delta,alpha,pct};
 },[d,neckCm,c0,rho,rated,rows]);
 const setCell=(id,k,v)=>setRows(rs=>rs.map(r=>r.id===id?{...r,[k]:v}:r));
 const add=()=>setRows(rs=>[...rs,{id:Date.now(),v:"",f:""}]);
 const reset=()=>setRows(DEFAULT_DATA.map((r,i)=>({id:i+1,v:r[0],f:r[1]})));
 const csv=()=>{const lines=["Water Added mL,Frequency Hz,Period s,Scaled Period Squared m4",...calc.data.map(r=>[r.v,r.f,r.T,r.y].join(","))];downloadBlob(lines.join("\n"),"helmholtz-data.csv","text/csv")};
 const png=()=>{const url=chartRef.current?.toBase64Image();if(url){const a=document.createElement("a");a.href=url;a.download="helmholtz-regression.png";a.click()}};
 const minX=Math.min(...calc.data.map(r=>r.v),0),maxX=Math.max(...calc.data.map(r=>r.v),1);
 const chartData={datasets:[{label:"Measured data",data:calc.data.map(r=>({x:r.v,y:r.y})),showLine:false,pointRadius:5},{label:"Least-squares fit",data:[{x:minX,y:calc.fit.m*minX+calc.fit.b},{x:maxX,y:calc.fit.m*maxX+calc.fit.b}],pointRadius:0,borderWidth:2}]};
 const options={responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"},title:{display:true,text:"Garrett Fig. 8.17-style linearized fit"}},scales:{x:{type:"linear",title:{display:true,text:"Added water volume ΔV (mL)"}},y:{title:{display:true,text:"Scaled period squared y (m⁴)"}}}};
 return <><Hero eyebrow="Garrett §8.5 · Eqs. 8.51–8.54" title="Helmholtz Resonator Experiment" text="Linearize resonance data and extract effective neck length, cavity volume, and end correction." formula="y = (c₀²A / 4π²)T²"/>
 <div className="toolbar"><button onClick={csv}><Download size={16}/>Export CSV</button><button onClick={png}><ImageDown size={16}/>Export Plot</button><button onClick={reset}><RotateCcw size={16}/>Reset data</button></div>
 <div className="grid"><Card><h3>Parameters</h3><div className="fields"><NumberField label="Neck diameter" value={d} set={setD} unit="mm"/><NumberField label="Physical neck length" value={neckCm} set={setNeckCm} unit="cm"/><NumberField label="Speed of sound" value={c0} set={setC0} unit="m/s"/><NumberField label="Air density" value={rho} set={setRho} unit="kg/m³"/><NumberField label="Rated bottle capacity" value={rated} set={setRated} unit="mL"/></div></Card>
 <Card><h3>Derived geometry</h3><div className="metrics"><Metric l="Radius a" v={num(calc.a*100,3)+" cm"}/><Metric l="Area A" v={num(calc.A*1e4,4)+" cm²"}/><Metric l="Pre-factor" v={sci(calc.pref)+" m⁴/s²"}/></div><p className="muted">ρ is retained for your lab record; the ideal Helmholtz linearization used here does not require it explicitly.</p></Card></div>
 <Card><div className="cardhead"><div><h3>Experimental data</h3><p className="muted">Edit any measurement; derived columns and the fit update immediately.</p></div><button onClick={add}><Plus size={16}/>Add row</button></div><div className="tablewrap"><table><thead><tr><th>ΔV (mL)</th><th>f (Hz)</th><th>T (s)</th><th>Scaled T² y (m⁴)</th><th></th></tr></thead><tbody>{rows.map(r=>{const f=+r.f,T=f>0?1/f:NaN,y=f>0?calc.pref/(f*f):NaN;return <tr key={r.id}><td><input value={r.v} onChange={e=>setCell(r.id,"v",e.target.value)}/></td><td><input value={r.f} onChange={e=>setCell(r.id,"f",e.target.value)}/></td><td>{Number.isFinite(T)?T.toFixed(7):"—"}</td><td>{sci(y)}</td><td><button className="danger" onClick={()=>setRows(rs=>rs.filter(x=>x.id!==r.id))}><Trash2 size={15}/></button></td></tr>})}</tbody></table></div></Card>
 <div className="grid resultsgrid"><Card><h3>Linear regression</h3><div className="chart"><Line ref={chartRef} data={chartData} options={options}/></div><div className="fitline">y = ({sci(calc.fit.m)}) ΔV + {sci(calc.fit.b)} <span>R² = {num(calc.fit.r2,6)}</span></div></Card>
 <Card><h3>Automated results</h3><div className="resultlist"><Result l="Slope (display units)" v={sci(calc.fit.m)+" m⁴/mL"}/><Result l="Slope converted to SI" v={sci(calc.fit.m*1e6)+" m"}/><Result l="Effective neck length Δx_eff" v={num(calc.dxEff*100,3)+" cm  ·  "+num(calc.dxEff,5)+" m"}/><Result l="Fitted empty volume V₀" v={num(calc.v0mL,2)+" mL  ·  "+sci(calc.v0mL*1e-6)+" m³"}/><Result l="End correction δL" v={num(calc.delta*100,3)+" cm"}/><Result l="End correction factor α = δL/a" v={num(calc.alpha,3)}/><Result l={"Difference from "+rated+" mL rated capacity"} v={num(calc.pct,2)+"%"}/></div><div className="callout">Unit check: the regression x-axis is mL, so the fitted slope is multiplied by 10⁶ before it is interpreted as an effective length.</div></Card></div></>
}
function Pipes(){return <><Hero eyebrow="ESC Pendulum Court" title="ESC Pipe Resonance Experiment" text="Next module: ideal predictions, measured/simulated spectra, percent error, and empirical end corrections." formula="δL theory = 0.6a"/><div className="notice"><strong>Simulation mode:</strong> synthetic frequencies will be clearly labeled simulated, never measured.</div><Card><h3>Pipe lengths queued for analysis</h3><div className="chips">{PIPE_LENGTHS.map(x=><span key={x}>{x.toFixed(2)} m</span>)}</div></Card></>}
function Hero({eyebrow,title,text,formula}){return <div className="hero"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div><div className="formula">{formula}</div></div>}
function NumberField({label,value,set,unit}){return <label>{label}<input type="number" step="any" value={value} onChange={e=>set(+e.target.value)}/><small>{unit}</small></label>}
function Metric({l,v}){return <div><span>{l}</span><strong>{v}</strong></div>}
function Result({l,v}){return <div><span>{l}</span><strong>{v}</strong></div>}
function downloadBlob(text,name,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
