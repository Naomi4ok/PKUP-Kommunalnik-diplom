import { useState, useRef, useEffect } from 'react';
import './AvatarUploadForm.css';

const AvatarUploadForm = ({ onAvatarUpload, maxSizeInMB = 5, initialImageUrl = null }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialImageUrl);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Set initial preview URL if provided
  useEffect(() => {
    if (initialImageUrl) {
      setPreviewUrl(initialImageUrl);
    }
  }, [initialImageUrl]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Reset previous states
    setError('');
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }
    
    // Validate file size (convert MB to bytes)
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setError(`Image size should not exceed ${maxSizeInMB}MB`);
      return;
    }
    
    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedImage(file);
    
    // Automatically upload when a valid file is selected
    handleImageUpload(file, objectUrl);
    
    // Clean up the URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleImageUpload = async (file, fileUrl) => {
    try {
      setIsUploading(true);
      
      // Call the provided callback with the uploaded image data
      onAvatarUpload({
        url: fileUrl,
        selectedImage: file,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="avatar-upload-container">
      <h3>Employee Photo</h3>
      
      <div className="avatar-upload-form">
        <div className="avatar-preview-container">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Avatar preview" 
              className="avatar-preview"
            />
          ) : (
            <div className="avatar-placeholder">
              <span>No image selected</span>
            </div>
          )}
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/png, image/jpeg, image/gif, image/webp"
          className="file-input"
          hidden
        />
        
        <div className="form-controls">
          <button 
            type="button" 
            onClick={triggerFileInput} 
            className="select-button"
            disabled={isUploading}
          >
            {previewUrl ? 'Change Image' : 'Select Image'}
          </button>
        </div>
        
        {error && <p className="error-message">{error}</p>}
        
        <p className="help-text">
          Supported formats: JPEG, PNG, GIF, WEBP. Maximum size: {maxSizeInMB}MB
        </p>
      </div>
    </div>
  );
};

export default AvatarUploadForm;