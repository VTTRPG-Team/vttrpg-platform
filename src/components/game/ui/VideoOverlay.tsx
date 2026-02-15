'use client';
import { 
  useParticipants, 
  VideoTrack, 
  useLocalParticipant,
  isTrackReference,
  useTracks, 
  RoomAudioRenderer
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Mic, MicOff, Video as VideoIcon, VideoOff, User, Headphones, HeadphoneOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Component ย่อย: โชว์วิดีโอ 1 คน
const PlayerBubble = ({ participant }: { participant: any }) => {
  // const isMe = participant.isLocal; // <-- ไม่จำเป็นต้องใช้ isMe แล้ว เพราะเราจะกลับด้านทุกคน
  const isMicOn = participant.isMicrophoneEnabled;
  const isSpeaking = participant.isSpeaking;

  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }]);
  const trackRef = tracks.find(t => t.participant.identity === participant.identity);
  const isCamOn = trackRef && !trackRef.publication?.isMuted;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!participant.identity) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', participant.identity)
        .single();
        
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };
    fetchAvatar();
  }, [participant.identity]);

  return (
    <div className={`relative w-20 h-20 rounded-full border-4 shadow-lg bg-gray-900 transition-all ${isSpeaking ? 'border-green-400 scale-110 shadow-[0_0_15px_rgba(74,222,128,0.5)]' : 'border-neutral-700'}`}>
       
       {/* 1. Video Layer */}
       <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center bg-gray-800">
          {isCamOn && trackRef && isTrackReference(trackRef) ? (
            <VideoTrack 
              trackRef={trackRef} 
              className="w-full h-full object-cover transform scale-x-[-1]" 
            />
          ) : avatarUrl ? (
            <img src={avatarUrl} alt={participant.name} className="w-full h-full object-cover" />
          ) : (
            <User className="text-gray-500 w-8 h-8" />
          )}
       </div>

       {/* 2. Status Badge (Mic Muted) */}
       {!isMicOn && (
         <div className="absolute -bottom-1 -right-1 bg-red-500 p-1 rounded-full border-2 border-black z-20">
           <MicOff size={10} className="text-white" />
         </div>
       )}

       {/* 3. Name Tag */}
       <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-bold text-white truncate max-w-[80px] z-30">
          {participant.name || 'Player'}
       </div>
    </div>
  );
};

// Component หลัก: แถบวิดีโอรวม
export default function VideoOverlay() {
  const participants = useParticipants(); 
  const { localParticipant } = useLocalParticipant();
  
  // State คุมปุ่มเปิด/ปิดของตัวเอง
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  useEffect(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(isMicOn);
      localParticipant.setCameraEnabled(isCamOn);
    }
  }, [isMicOn, isCamOn, localParticipant]);

  return (
    <div className="flex flex-col items-center gap-6 pointer-events-auto">
       
       {isSpeakerOn && <RoomAudioRenderer />}

       {/* ลิสต์รายชื่อคนในห้อง */}
       {participants.map((p) => (
         <PlayerBubble key={p.identity} participant={p} />
       ))}

       {/* แถบปุ่มควบคุม */}
       <div className="mt-2 flex gap-2 bg-black/60 p-2 rounded-full border border-white/20 backdrop-blur shadow-xl">
          <button onClick={() => setIsMicOn(!isMicOn)} className={`p-2 rounded-full transition-colors ${isMicOn ? 'bg-neutral-700 text-white hover:bg-neutral-600' : 'bg-red-500 text-white hover:bg-red-600'}`} title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}>
            {isMicOn ? <Mic size={16}/> : <MicOff size={16}/>}
          </button>
          <button onClick={() => setIsCamOn(!isCamOn)} className={`p-2 rounded-full transition-colors ${isCamOn ? 'bg-neutral-700 text-white hover:bg-neutral-600' : 'bg-red-500 text-white hover:bg-red-600'}`} title={isCamOn ? 'Turn Off Camera' : 'Turn On Camera'}>
            {isCamOn ? <VideoIcon size={16}/> : <VideoOff size={16}/>}
          </button>
          <button onClick={() => setIsSpeakerOn(!isSpeakerOn)} className={`p-2 rounded-full transition-colors ${isSpeakerOn ? 'bg-neutral-700 text-white hover:bg-neutral-600' : 'bg-red-500 text-white hover:bg-red-600'}`} title={isSpeakerOn ? 'Mute Audio' : 'Unmute Audio'}>
            {isSpeakerOn ? <Headphones size={16}/> : <HeadphoneOff size={16}/>}
          </button>
       </div>

    </div>
  );
}