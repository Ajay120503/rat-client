import { useState } from "react";
import { FiTrash2, FiExternalLink, FiX } from "react-icons/fi";

export default function PhotoGrid({
  photos,
  onDelete,
  onDeleteAll,
  onRefresh,
  onTakePhoto,
  title = "Photos",
  emptyMsg = "No photos",
  emptyIcon: Icon,
}) {
  const [selected, setSelected] = useState(null);
  if (!photos?.length) {
    return (
      <div className="glass-effect rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onTakePhoto}
            className="text-sm bg-primary-500/10 text-primary-400 border border-primary-500/30 px-4 py-2 rounded-xl"
          >
            Take Photo
          </button>
        </div>
        <div className="text-center py-8 text-dark-400">
          {Icon && <Icon className="text-3xl mx-auto mb-2 opacity-50" />}
          <p className="text-sm">{emptyMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {title} ({photos.length})
        </h3>
        <div className="flex gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-sm bg-primary-500/10 text-primary-400 border border-primary-500/30 px-4 py-2 rounded-xl"
            >
              Refresh
            </button>
          )}
          {onDeleteAll && (
            <button
              onClick={onDeleteAll}
              className="text-sm bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl"
            >
              Delete All
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...photos].reverse().map((photo, i) => (
          <div key={photo.publicId || i} className="relative group">
            <img
              src={photo.url}
              alt=""
              className="w-full h-48 object-cover rounded-xl cursor-pointer"
              onClick={() => setSelected(photo.url)}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
              <button
                onClick={() => onDelete(photo.publicId)}
                className="p-2 bg-red-500/80 rounded-lg hover:bg-red-500"
              >
                <FiTrash2 className="text-white" />
              </button>
              <button
                onClick={() => window.open(photo.url, "_blank")}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
              >
                <FiExternalLink className="text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8"
          onClick={() => setSelected(null)}
        >
          <img
            src={selected}
            alt=""
            className="max-w-full max-h-full rounded-xl"
          />
          <button
            className="absolute top-4 right-4 p-2 bg-dark-700/80 rounded-full"
            onClick={() => setSelected(null)}
          >
            <FiX className="text-xl" />
          </button>
        </div>
      )}
    </div>
  );
}
