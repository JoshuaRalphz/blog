import { CldUploadWidget } from 'next-cloudinary';

export default function ImageUpload({ onSuccess }) {
  return (
    <CldUploadWidget
      uploadPreset="your_upload_preset"
      onSuccess={(result) => onSuccess(result.info.secure_url)}
    >
      {({ open }) => (
        <button 
          type="button" 
          onClick={() => open()}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Upload Image
        </button>
      )}
    </CldUploadWidget>
  );
} 