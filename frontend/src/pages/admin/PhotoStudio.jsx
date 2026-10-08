import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileText, ImagePlus, Loader2, RotateCcw } from 'lucide-react';
import { createSheet, processPhoto } from '../../services/photoApi';
import { getErrorMessage } from '../../services/api';
import { Alert } from '../../components/ui';

const download = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};
const loadImage = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

export default function PhotoStudio() {
  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [data, setData] = useState(null);            // server result
  const [imgs, setImgs] = useState(null);            // { enhanced, plain } HTMLImageElements
  const [useEnhanced, setUseEnhanced] = useState(true);
  const [crop, setCrop] = useState(null);            // { cx, cy, w } in source pixels
  const [bright, setBright] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [copies, setCopies] = useState(6);
  const [paper, setPaper] = useState('letter');
  const [making, setMaking] = useState(false);
  const canvas = useRef();
  const drag = useRef(null);

  const reset = () => { setFile(null); setData(null); setImgs(null); setErr(''); setOriginalUrl(''); setBright(100); setContrast(100); };

  const onPick = async (f) => {
    if (!f) return;
    reset(); setFile(f); setOriginalUrl(URL.createObjectURL(f)); setBusy(true);
    try {
      const d = await processPhoto(f);
      const [enhanced, plain] = await Promise.all([loadImage(d.enhanced), loadImage(d.plain)]);
      setData(d); setImgs({ enhanced, plain });
      setCrop({ cx: d.crop.x + d.crop.w / 2, cy: d.crop.y + d.crop.h / 2, w: d.crop.w });
    } catch (e) { setErr(getErrorMessage(e)); }
    finally { setBusy(false); }
  };

  const draw = useCallback((target, scaleW) => {
    if (!data || !imgs || !crop) return;
    const img = useEnhanced ? imgs.enhanced : imgs.plain;
    const W = scaleW, H = Math.round(scaleW / data.aspect);
    target.width = W; target.height = H;
    const ctx = target.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = `brightness(${bright}%) contrast(${contrast}%)`;
    const ch = crop.w / data.aspect, k = W / crop.w;
    ctx.drawImage(img, 0, 0, img.width, img.height, -(crop.cx - crop.w / 2) * k, -(crop.cy - ch / 2) * k, img.width * k, img.height * k);
    ctx.filter = 'none';
  }, [data, imgs, crop, useEnhanced, bright, contrast]);

  useEffect(() => { if (canvas.current) draw(canvas.current, 400); }, [draw]);

  const render = () => {
    const c = document.createElement('canvas');
    draw(c, data.outWidth);
    return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.95));
  };

  const onDown = (e) => { drag.current = { x: e.clientX, y: e.clientY, cx: crop.cx, cy: crop.cy }; e.currentTarget.setPointerCapture(e.pointerId); };
  const onMove = (e) => {
    if (!drag.current) return;
    const k = crop.w / e.currentTarget.getBoundingClientRect().width;
    setCrop({ ...crop, cx: drag.current.cx - (e.clientX - drag.current.x) * k, cy: drag.current.cy - (e.clientY - drag.current.y) * k });
  };
  const onUp = () => { drag.current = null; };

  const savePhoto = async () => download(await render(), 'passport-photo.jpg');
  const savePdf = async () => {
    setMaking(true); setErr('');
    try { download(await createSheet(await render(), { copies, paper }), 'passport-photos.pdf'); }
    catch (e) { setErr(getErrorMessage(e)); } finally { setMaking(false); }
  };
  const zMin = data ? data.width * 0.25 : 0;
  const zMax = data ? data.width * 1.6 : 1;
  const autoFit = () => data && setCrop({ cx: data.crop.x + data.crop.w / 2, cy: data.crop.y + data.crop.h / 2, w: data.crop.w });

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold">Passport Photo Studio</h1>
      <p className="mt-1 text-sm text-slate-600">Upload the customer's photo. The background is removed (white), the photo is cropped to passport size, and you can download the photo or a print sheet.</p>
      <div className="mt-4"><Alert>{err}</Alert></div>

      {!data && (
        <div className="card mt-4">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-10 text-center hover:border-brand-600">
            {busy ? <Loader2 className="h-8 w-8 animate-spin text-brand-600" /> : <ImagePlus className="h-8 w-8 text-brand-600" />}
            <span className="font-medium">{busy ? 'Removing background... this can take 10-30 seconds' : 'Choose customer photo (JPG, PNG, WebP)'}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={busy} onChange={(e) => onPick(e.target.files[0])} />
          </label>
          {originalUrl && busy && <img src={originalUrl} alt="Original" className="mx-auto mt-4 max-h-48 rounded-lg" />}
        </div>
      )}

      {data && crop && (
        <div className="mt-4 grid gap-6 lg:grid-cols-[auto,1fr]">
          <div>
            <p className="mb-2 text-sm font-medium">Preview (drag to move)</p>
            <canvas ref={canvas} className="w-full max-w-[340px] cursor-move touch-none rounded border border-slate-300 bg-white"
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
            <p className="mt-2 text-xs text-slate-500">Original</p>
            <img src={originalUrl} alt="Original" className="mt-1 max-h-28 rounded border" />
          </div>

          <div className="space-y-5">
            <div className="card space-y-4">
              <h2 className="font-semibold">Adjust</h2>
              <label className="block text-sm">Zoom (right = bigger face)
                <input type="range" className="w-full" min={zMin} max={zMax} step="1" value={Math.round(zMin + zMax - crop.w)}
                  onChange={(e) => setCrop({ ...crop, w: zMin + zMax - Number(e.target.value) })} />
              </label>
              <label className="block text-sm">Move left / right
                <input type="range" className="w-full" min={0} max={data.width} value={Math.round(crop.cx)} onChange={(e) => setCrop({ ...crop, cx: Number(e.target.value) })} />
              </label>
              <label className="block text-sm">Move up / down
                <input type="range" className="w-full" min={0} max={data.height} value={Math.round(crop.cy)} onChange={(e) => setCrop({ ...crop, cy: Number(e.target.value) })} />
              </label>
              <label className="block text-sm">Brightness ({bright}%)
                <input type="range" className="w-full" min="70" max="140" value={bright} onChange={(e) => setBright(Number(e.target.value))} />
              </label>
              <label className="block text-sm">Contrast ({contrast}%)
                <input type="range" className="w-full" min="70" max="150" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} />
              </label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={useEnhanced} onChange={(e) => setUseEnhanced(e.target.checked)} />Auto colour clean-up (turn off if the colours look wrong)</label>
              <button className="btn-secondary btn-sm" onClick={() => { autoFit(); setBright(100); setContrast(100); setUseEnhanced(true); }}><RotateCcw className="h-3.5 w-3.5" />Reset to automatic</button>
            </div>

            <div className="card space-y-4">
              <h2 className="font-semibold">Download</h2>
              <button className="btn-secondary" onClick={savePhoto}><Download className="h-4 w-4" />Photo (JPG, white background)</button>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">Photos on sheet
                  <select className="input mt-1" value={copies} onChange={(e) => setCopies(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6, 12, 18, 24, 30].map((n) => <option key={n} value={n}>{n}{n === 6 ? ' (one row, like your template)' : ''}</option>)}
                  </select></label>
                <label className="text-sm">Paper
                  <select className="input mt-1" value={paper} onChange={(e) => setPaper(e.target.value)}>
                    <option value="letter">Letter (same as your template)</option><option value="a4">A4</option>
                  </select></label>
              </div>
              <button className="btn-primary" disabled={making} onClick={savePdf}>{making ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}Print sheet (PDF)</button>
              <button className="btn-secondary btn-sm" onClick={reset}>Start with another photo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
