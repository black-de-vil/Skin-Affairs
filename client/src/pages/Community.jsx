import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';

/* ------------------------------------------------------------------ */
/*  Inline icons                                                       */
/* ------------------------------------------------------------------ */

const HeartIcon = ({ filled, className }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} className={className}>
    <path
      d="M12 20.5s-7.5-4.6-10-9.2C.5 8 2 4.5 5.5 4c2.1-.3 3.9.8 4.9 2.4.2.3.7.3.9 0C12.3 4.8 14.1 3.7 16.2 4c3.5.5 5 4 3.5 7.3C19.5 15.9 12 20.5 12 20.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Loading / empty states                                            */
/* ------------------------------------------------------------------ */

const ImageSkeleton = () => (
  <div
    className="mb-4 break-inside-avoid rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 animate-pulse"
    style={{ height: `${180 + Math.round(Math.random() * 140)}px` }}
  />
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900 flex items-center justify-center border border-purple-500/30">
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="#A78BFA" strokeWidth="1.6" />
        <circle cx="9" cy="10" r="1.6" fill="#A78BFA" />
        <path d="M21 15l-5-5-9 9" stroke="#A78BFA" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
    <h3 className="text-gray-800 dark:text-slate-200 font-semibold">No community images yet</h3>
    <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs">
      Published images from everyone using Skin Affairs will show up here.
    </p>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Card + Lightbox                                                    */
/* ------------------------------------------------------------------ */

const CommunityCard = ({ image, liked, onToggleLike, onOpen }) => (
  <div
    className="mb-4 break-inside-avoid group relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
    onClick={() => onOpen(image)}
  >
    <img
      src={image.imageUrl}
      alt={image.prompt || 'Community image'}
      loading="lazy"
      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
      {image.prompt && <p className="text-white text-xs line-clamp-2 mb-2">{image.prompt}</p>}
      <div className="flex items-center justify-between">
        <span className="text-white/80 text-[11px]">{image.userName || 'Anonymous'}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike(image);
          }}
          className={`flex items-center gap-1 text-xs transition-colors ${
            liked ? 'text-pink-400' : 'text-white/90 hover:text-pink-300'
          }`}
        >
          <HeartIcon filled={liked} className="w-4 h-4" />
          {image.likes?.length || 0}
        </button>
      </div>
    </div>
  </div>
);

const Lightbox = ({ image, onClose }) => {
  if (!image) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-white/80 hover:text-white">
        <CloseIcon className="w-6 h-6" />
      </button>
      <img
        src={image.imageUrl}
        alt={image.prompt || 'Community image'}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
      />
      {image.prompt && (
        <p
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-xl text-center text-sm text-white/90 bg-black/40 px-4 py-2 rounded-full"
        >
          {image.prompt}
        </p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Community page                                                     */
/* ------------------------------------------------------------------ */

const Community = () => {
  const { user } = useAppContext();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openImage, setOpenImage] = useState(null);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      // Adjust this endpoint to match your backend once it's connected
      const { data } = await axios.get('/api/user/published-images');
      setImages(data.success ? data.images : []);
    } catch (err) {
      // No backend yet, or the request failed — fail gracefully instead of crashing
      setError("Couldn't load community images — check that your backend/API is connected.");
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const toggleLike = async (image) => {
    if (!user) return; // swap for navigate('/login') if you want to force sign-in

    const alreadyLiked = image.likes?.includes(user._id);

    // Optimistic update so the UI feels instant
    setImages((prev) =>
      prev.map((img) =>
        img._id === image._id
          ? {
              ...img,
              likes: alreadyLiked
                ? img.likes.filter((id) => id !== user._id)
                : [...(img.likes || []), user._id],
            }
          : img
      )
    );

    try {
      const { data } = await axios.post('/api/user/toggle-like-image', {
        chatId: image.chatId,
        imageId: image._id,
      });
      if (!data?.success) {
        setImages((prev) => prev.map((img) => (img._id === image._id ? image : img)));
      }
    } catch (err) {
      // Revert on failure
      setImages((prev) => prev.map((img) => (img._id === image._id ? image : img)));
    }
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 px-4 sm:px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Community</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Skin analyses and looks shared by everyone using Skin Affairs.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <ImageSkeleton key={i} />
            ))}
          </div>
        ) : images.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
            {images.map((img) => (
              <CommunityCard
                key={img._id}
                image={img}
                liked={user ? img.likes?.includes(user._id) : false}
                onToggleLike={toggleLike}
                onOpen={setOpenImage}
              />
            ))}
          </div>
        )}
      </div>

      <Lightbox image={openImage} onClose={() => setOpenImage(null)} />
    </div>
  );
};

export default Community;