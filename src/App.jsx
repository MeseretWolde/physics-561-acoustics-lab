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
function Pipes(){
 const[d,setD]=useState(6.5),[c0,setC0]=useState(343),[corrFactor,setCorrFactor]=useState(.6);
 const[rows,setRows]=useState(()=>PIPE_LENGTHS.map((L,i)=>({id:i,L,oo:"",oc:""})));
 const a=d/2000,deltaTheory=corrFactor*a;
 const update=(id,k,v)=>setRows(rs=>rs.map(r=>r.id===id?{...r,[k]:v}:r));
 const values=rows.map(r=>{const L=+r.L,oo0=c0/(2*L),oc0=c0/(4*L),oo=+r.oo,oc=+r.oc;
  const ooErr=oo>0?Math.abs(oo-oo0)/oo0*100:NaN,ocErr=oc>0?Math.abs(oc-oc0)/oc0*100:NaN;
  const ooDelta=oo>0?(c0/(2*oo)-L)/2:NaN,ocDelta=oc>0?c0/(4*oc)-L:NaN;
  return{...r,L,oo0,oc0,oo,oc,ooErr,ocErr,ooDelta,ocDelta}});
 const simulate=()=>setRows(rs=>rs.map(r=>{const L=+r.L;return{...r,oo:(c0/(2*(L+2*deltaTheory))).toFixed(3),oc:(c0/(4*(L+deltaTheory))).toFixed(3)}}));
 const clear=()=>setRows(PIPE_LENGTHS.map((L,i)=>({id:i,L,oo:"",oc:""})));
 const csv=()=>{const lines=["Length m,OO theory Hz,OO entered Hz,OO percent error,OO deltaL per end m,OC theory Hz,OC entered Hz,OC percent error,OC deltaL m",...values.map(r=>[r.L,r.oo0,r.oo||"",r.ooErr,r.ooDelta,r.oc0,r.oc||"",r.ocErr,r.ocDelta].join(","))];downloadBlob(lines.join("\n"),"esc-pipe-analysis.csv","text/csv")};
 const validOO=values.filter(r=>Number.isFinite(r.ooDelta)),validOC=values.filter(r=>Number.isFinite(r.ocDelta));
 const avg=x=>x.length?x.reduce((s,r)=>s+r,0)/x.length:NaN,avgOO=avg(validOO.map(r=>r.ooDelta)),avgOC=avg(validOC.map(r=>r.ocDelta));
 return <><Hero eyebrow="ESC Pendulum Court · Pipe Resonance" title="ESC Pipe Resonance Experiment" text="Start from no-end-correction theory, compare entered frequencies, then extract the empirical correction at each open end." formula="δL theory = 0.6a"/>
 <div className="toolbar"><button onClick={csv}><Download size={16}/>Export CSV</button><button onClick={simulate}><Waves size={16}/>Fill simulated 0.6a data</button><button onClick={clear}><RotateCcw size={16}/>Clear frequencies</button></div>
 <div className="notice"><strong>Important:</strong> “Fill simulated 0.6a data” generates synthetic frequencies from the theoretical end correction. They are labeled simulated and are not substitutes for physical measurements unless your instructor permits a simulation.</div>
 <div className="grid"><Card><h3>Pipe setup</h3><div className="fields"><NumberField label="Inner diameter" value={d} set={setD} unit="mm"/><NumberField label="Speed of sound" value={c0} set={setC0} unit="m/s"/><NumberField label="Reference correction factor" value={corrFactor} set={setCorrFactor} unit="× radius a"/></div></Card>
 <Card><h3>Reference values</h3><div className="metrics"><Metric l="Radius a" v={num(a*1000,3)+" mm"}/><Metric l={corrFactor+"a per open end"} v={num(deltaTheory*1000,3)+" mm"}/><Metric l="Open–open effective length" v="L + 2δL"/><Metric l="Open–closed effective length" v="L + δL"/></div></Card></div>
 <Card><div className="cardhead"><div><h3>Pipe length comparison</h3><p className="muted">Theory columns intentionally use no end correction, matching the assignment.</p></div></div><div className="tablewrap"><table className="pipetable"><thead><tr><th>L (m)</th><th>OO theory (Hz)</th><th>OO entered (Hz)</th><th>OO error</th><th>OO δL/end (mm)</th><th>OC theory (Hz)</th><th>OC entered (Hz)</th><th>OC error</th><th>OC δL (mm)</th></tr></thead><tbody>{values.map(r=><tr key={r.id}><td>{r.L.toFixed(2)}</td><td>{num(r.oo0,2)}</td><td><input value={r.oo} placeholder="measured" onChange={e=>update(r.id,"oo",e.target.value)}/></td><td>{Number.isFinite(r.ooErr)?num(r.ooErr,2)+"%":"—"}</td><td>{Number.isFinite(r.ooDelta)?num(r.ooDelta*1000,3):"—"}</td><td>{num(r.oc0,2)}</td><td><input value={r.oc} placeholder="measured" onChange={e=>update(r.id,"oc",e.target.value)}/></td><td>{Number.isFinite(r.ocErr)?num(r.ocErr,2)+"%":"—"}</td><td>{Number.isFinite(r.ocDelta)?num(r.ocDelta*1000,3):"—"}</td></tr>)}</tbody></table></div></Card>
 <div className="grid"><Card><h3>End-correction summary</h3><div className="resultlist"><Result l="Reference unflanged correction" v={num(deltaTheory*1000,3)+" mm = "+corrFactor+"a"}/><Result l="Average OO correction per open end" v={Number.isFinite(avgOO)?num(avgOO*1000,3)+" mm":"Enter OO frequencies"}/><Result l="Average OC correction" v={Number.isFinite(avgOC)?num(avgOC*1000,3)+" mm":"Enter OC frequencies"}/></div></Card>
 <Card><h3>Assignment comparison</h3><p className="muted">Open–open extraction: δL = ½[c₀/(2f) − L]. Open–closed extraction: δL = c₀/(4f) − L.</p><div className="callout">{Number.isFinite(avgOO)&&Number.isFinite(avgOC)?<>Average OC / average OO-per-end = <strong>{num(avgOC/avgOO,3)}</strong>. Compare this experimental ratio with the wording of your assignment and discuss what your data show.</>:"Enter frequencies (or use the simulation button) to populate the comparison."}</div></Card></div>
 <Card><h3>FFT / recording analysis</h3><p className="muted">Next build: upload a WAV/audio recording, analyze the full recording for high frequency resolution, identify dominant peaks, and copy a selected peak into the pipe table. A separate synthetic-spectrum teaching mode will remain clearly marked as simulated.</p></Card></>
}
function Hero({eyebrow,title,text,formula}){return <div className="hero"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div><div className="formula">{formula}</div></div>}
function NumberField({label,value,set,unit}){return <label>{label}<input type="number" step="any" value={value} onChange={e=>set(+e.target.value)}/><small>{unit}</small></label>}
function Metric({l,v}){return <div><span>{l}</span><strong>{v}</strong></div>}
function Result({l,v}){return <div><span>{l}</span><strong>{v}</strong></div>}
function downloadBlob(text,name,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
