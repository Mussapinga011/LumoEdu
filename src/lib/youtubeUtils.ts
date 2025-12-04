export const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const getYoutubeThumbnail = (videoId: string, quality: 'maxres' | 'hq' | 'mq' = 'hq'): string => {
  // maxresdefault.jpg (1280x720) - HD
  // hqdefault.jpg (480x360) - High Quality
  // mqdefault.jpg (320x180) - Medium Quality
  // default.jpg (120x90) - Low Quality
  
  const filename = quality === 'maxres' ? 'maxresdefault.jpg' : 
                   quality === 'hq' ? 'hqdefault.jpg' : 'mqdefault.jpg';
                   
  return `https://img.youtube.com/vi/${videoId}/${filename}`;
};
