'use client'
import { useState, useEffect } from 'react';
import { CheckCircle, User, Mic, MicOff, Video, VideoOff, Headphones, HeadphoneOff, Crown } from 'lucide-react';
import { useTracks, VideoTrack, useLocalParticipant, isTrackReference } from '@livekit/components-react';
import { Track } from 'livekit-client';

const PlayerVideo = ({ participantIdentity }: { participantIdentity: string }) => {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }], { onlySubscribed: true });
  const userTrack = tracks.find(t => t.participant.identity === participantIdentity);
  if (userTrack && isTrackReference(userTrack) && !userTrack.publication.isMuted) {
    return <VideoTrack trackRef={userTrack} className="w-full h-full object-cover transform scale-x-[-1] rounded-full" />;
  }
  return null; 
};

const MyControls = ({ isMicOn, isCamOn, toggleMic, toggleCam }: any) => {
  const { localParticipant } = useLocalParticipant();
  useEffect(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(isMicOn);
      localParticipant.setCameraEnabled(isCamOn);
    }
  }, [isMicOn, isCamOn, localParticipant]);

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30 rounded-full">
       <button onClick={toggleMic} className={`p-1.5 rounded-full ${isMicOn ? 'bg-gray-200 text-green-700' : 'bg-red-500 text-white'}`}>{isMicOn ? <Mic size={14}/> : <MicOff size={14}/>}</button>
       <button onClick={toggleCam} className={`p-1.5 rounded-full ${isCamOn ? 'bg-gray-200 text-blue-700' : 'bg-red-500 text-white'}`}>{isCamOn ? <Video size={14}/> : <VideoOff size={14}/>}</button>
    </div>
  );
};

export default function PlayerGrid({ players, room, currentUser, token }: any) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  return (
    <div className="flex gap-4 overflow-x-auto px-2 items-start h-[180px] flex-shrink-0 no-scrollbar">
       <style jsx>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
       {players.map((p: any) => {
         const isMe = p.id === currentUser.id;
         return (
           <div key={p.uniqueKey} className={`w-36 flex-shrink-0 rounded-lg border-2 p-2 flex flex-col items-center shadow-lg relative transition-all duration-300 ${p.isReady ? 'bg-green-100 border-green-600 scale-105' : 'bg-[#F4E4BC] border-[#5A2D0C]'}`}>
              <div className="w-24 h-24 rounded-full border-4 border-[#3e2723] overflow-hidden bg-gray-900 relative group">
                 <div className="absolute inset-0 z-0 flex items-center justify-center bg-gray-800">
                    {p.avatar ? ( <img src={p.avatar} className="w-full h-full object-cover" alt="Avatar" /> ) : ( <User className="text-gray-400 w-12 h-12" /> )}
                 </div>
                 {token && ( <div className="absolute inset-0 z-10"><PlayerVideo participantIdentity={p.id} /></div> )}
                 {isMe && token && ( <MyControls isMicOn={isMicOn} isCamOn={isCamOn} toggleMic={() => setIsMicOn(!isMicOn)} toggleCam={() => setIsCamOn(!isCamOn)} /> )}
                 {p.isReady && <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center animate-in fade-in zoom-in pointer-events-none z-20"><CheckCircle className="text-white w-10 h-10 drop-shadow-md"/></div>}
              </div>
              <div className="mt-2 text-xs font-bold text-center truncate w-full text-[#3e2723] px-1 bg-white/50 rounded flex justify-between items-center">
                 <span className="truncate flex-1 text-left">{p.name}</span>
                 {isMe && (
                    <button onClick={() => setIsSpeakerOn(!isSpeakerOn)} className="ml-1 text-[#5A2D0C] hover:scale-110" title="Toggle Sound">
                       {isSpeakerOn ? <Headphones size={14}/> : <HeadphoneOff size={14} className="text-red-500"/>}
                    </button>
                 )}
              </div>
              {p.id === room.host_id && <div className="absolute -top-5 -left-3 z-30 drop-shadow-lg filter"><Crown className="text-yellow-500 fill-yellow-400 w-8 h-8 animate-pulse-slow"/></div>}
           </div>
         );
       })}
       {[...Array(Math.max(0, room.max_players - players.length))].map((_, i) => (
          <div key={i} className="w-36 flex-shrink-0 border-2 border-dashed border-[#F4E4BC]/30 rounded-lg flex flex-col items-center justify-center text-[#F4E4BC]/30 font-bold bg-black/20 h-36">
             <span className="text-4xl mb-2 opacity-50">+</span><span className="text-sm">Empty</span>
          </div>
       ))}
    </div>
  )
}