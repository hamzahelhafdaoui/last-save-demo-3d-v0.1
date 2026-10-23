#!/usr/bin/env python3
"""Validate the downloadable production package with Python's standard library."""
import argparse,hashlib,io,json,re,struct,wave,zipfile
from pathlib import PurePosixPath,Path

def verify(filename):
    prefix='LAST-SAVE-Soundtrack-Production/'
    with zipfile.ZipFile(filename) as z:
        assert z.testzip() is None, 'ZIP CRC failure'
        names=z.namelist(); assert len(names)==len(set(names)), 'Duplicate ZIP members'
        assert all(n.startswith(prefix) and '..' not in PurePosixPath(n).parts for n in names), 'Unsafe paths'
        files={n[len(prefix):]:n for n in names}
        checks={line.split('  ',1)[1]:line.split('  ',1)[0] for line in z.read(files['SHA256SUMS.txt']).decode().splitlines()}
        assert set(checks)==set(files)-{'SHA256SUMS.txt'}, 'Incomplete manifest'
        for file,digest in checks.items(): assert hashlib.sha256(z.read(files[file])).hexdigest()==digest, file
        wavs=[f for f in files if f.endswith('.wav')]
        assert len(wavs)==28 and sum('/Stems/' in f for f in wavs)==24
        for f in wavs:
            with wave.open(io.BytesIO(z.read(files[f])),'rb') as w:
                assert (w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getnframes())==(2,3,48000,1152000),f
        proof=json.loads(z.read(files['Verification/Verified-WAV-SHA256.json']))
        assert set(proof)==set(wavs), 'REAPER verification coverage'
        for file,digest in proof.items(): assert hashlib.sha256(z.read(files[file])).hexdigest()==digest, 'Changed since REAPER verification: '+file
        projects=[f for f in files if f.endswith('.rpp')]; assert len(projects)==5
        item_total=0
        for f in projects:
            text=z.read(files[f]).decode()
            sources=re.findall(r'^\s*FILE "([^"]+)"',text,re.M)
            assert len(sources)==(28 if '/' not in f else 7),f
            for source in sources:
                assert not PurePosixPath(source).is_absolute() and '..' not in PurePosixPath(source).parts
                target=str(PurePosixPath(f).parent/source); assert target in files,target
            item_total+=len(sources)
        mids=[f for f in files if f.endswith('.mid')];assert len(mids)==28
        for f in mids:
            data=z.read(files[f]);assert data[:4]==b'MThd'
            format,tracks,ppq=struct.unpack('>HHH',data[8:14]);assert format==1 and ppq==960
            assert tracks==(7 if f.endswith('All-Layers.mid') else 2)
        image=z.read(files['LAST-SAVE-Production.png']);assert image[:8]==b'\x89PNG\r\n\x1a\n'
        assert struct.unpack('>II',image[16:24])==(1680,1050)
        report=json.loads(z.read(files['Validation-Report.json']))
        assert len(report['cues'])==4
        for cue,r in report['cues'].items():
            assert r['scalar_original_max_error']<1e-9 and r['stem_null_peak']<=4/8388608
        reaper=json.loads(z.read(files['Verification/REAPER-Render-Validation.json']))
        assert reaper['frames']==4608000 and reaper['max_error_vs_sum_of_exported_stems']==0 and reaper['clipped_samples']==0
        print(json.dumps({'verified':True,'files':len(files),'stems':24,'reference_wavs':4,'midi_files':len(mids),'native_sessions':len(projects),'resolved_session_items':item_total,'production_picture':'1680x1050 actual REAPER capture','zip_sha256':hashlib.sha256(Path(filename).read_bytes()).hexdigest()},indent=2))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('zip',type=Path);verify(p.parse_args().zip)
