-- Run with: LAST_SAVE_PRODUCTION_ROOT=/absolute/export/path reaper -nonewinst verify-reaper.lua
-- Open the full production project first if REAPER is already running. Evaluates all native sessions without saving/replacing them.
local _, currentfile = reaper.EnumProjects(-1, '')
local root = os.getenv('LAST_SAVE_PRODUCTION_ROOT') or currentfile:gsub('\\','/'):match('^(.*)/[^/]+$')
assert(root, 'Open LAST-SAVE-Full-Production.rpp first')
local report = {application='REAPER 7.82 Linux x86_64', sessions={}}
local function json(v)
 if type(v)=='string' then return '"'..v:gsub('\\','\\\\'):gsub('"','\\"'):gsub('\n','\\n')..'"' end
 if type(v)=='number' or type(v)=='boolean' then return tostring(v) end
 if type(v)=='table' then
  local a={}; if #v>0 then for _,x in ipairs(v) do a[#a+1]=json(x) end; return '['..table.concat(a,',')..']' end
  for k,x in pairs(v) do a[#a+1]=json(k)..':'..json(x) end;return '{'..table.concat(a,',')..'}'
 end
 error('Unsupported JSON type')
end
local projects={'home/LAST-SAVE-home.rpp','lumen/LAST-SAVE-lumen.rpp','city/LAST-SAVE-city.rpp','sanctuary/LAST-SAVE-sanctuary.rpp','LAST-SAVE-Full-Production.rpp'}
for idx,file in ipairs(projects) do
 reaper.Main_openProject('noprompt:'..root..'/'..file)
 assert(reaper.CountTracks(0)==7, 'Expected 6 production layers + muted reference')
 local overview=idx==5
 local total,markers,regions=reaper.CountProjectMarkers(0)
 assert(markers==0 and regions==(overview and 4 or 1), 'Cue region layout')
 local expectedLen=overview and 96 or 24
 assert(math.abs(reaper.GetProjectLength(0)-expectedLen)<0.00001,'Session duration')
 local items=0
 for i=0,6 do
  local tr=reaper.GetTrack(0,i)
  assert(reaper.CountTrackMediaItems(tr)==(overview and 4 or 1),'Track item count')
  assert(reaper.GetMediaTrackInfo_Value(tr,'B_MUTE')==(i==6 and 1 or 0),'Muted reference only')
  assert(reaper.GetMediaTrackInfo_Value(tr,'D_VOL')==1,'Unity faders')
  for j=0,reaper.CountTrackMediaItems(tr)-1 do
   local item=reaper.GetTrackMediaItem(tr,j)
   assert(math.abs(reaper.GetMediaItemInfo_Value(item,'D_POSITION')-j*24)<0.00001,'Item alignment')
   assert(math.abs(reaper.GetMediaItemInfo_Value(item,'D_LENGTH')-24)<0.00001,'Item duration')
   local take=reaper.GetActiveTake(item); assert(take,'Active WAV take')
   local src=reaper.GetMediaItemTake_Source(take)
   assert(reaper.GetMediaSourceSampleRate(src)==48000,'Source sample rate')
   assert(reaper.GetMediaSourceNumChannels(src)==2,'Stereo source')
   assert(math.abs(reaper.GetMediaSourceLength(src)-24)<0.00001,'Loaded source length')
   local sourcefile=reaper.GetMediaSourceFileName(src,'')
   local f=assert(io.open(sourcefile,'rb'),'Missing audio'); f:close(); items=items+1
  end
 end
 local qn=reaper.TimeMap2_timeToQN(0,expectedLen)
 assert(math.abs(qn-(overview and 96 or (idx==3 and 48 or 16)))<0.00001,'Tempo grid duration')
 if overview then
  assert(reaper.CountTempoTimeSigMarkers(0)==3,'Three tempo segments')
  local expect={{0,40},{48,120},{72,40}}
  for i=0,2 do
   local ok,pos,measure,beat,bpm,num,den,linear=reaper.GetTempoTimeSigMarker(0,i)
   assert(ok and pos==expect[i+1][1] and bpm==expect[i+1][2] and not linear,'Tempo transitions')
  end
 end
 report.sessions[#report.sessions+1]={project=file,tracks=7,loaded_wav_items=items,duration_seconds=expectedLen,quarter_notes=qn,regions=regions,missing_assets=0,reference_muted=true}
end
local f=assert(io.open(root..'/REAPER-Project-Inspection.json','w'));f:write(json(report)..'\n');f:close()
reaper.SetEditCurPos(12,false,false)
reaper.UpdateArrange()
