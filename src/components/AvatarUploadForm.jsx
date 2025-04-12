import { useState, useRef } from 'react';
import './AvatarUploadForm.css'; // You can create this file for styling

const AvatarUploadForm = ({ onAvatarUpload, maxSizeInMB = 5 }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

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
    
    // Clean up the URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Create a FormData object to hold the file
      const formData = new FormData();
      formData.append('avatar', selectedImage);
      
      // This is where you would call your API to upload the image
      // Example:
      // const response = await fetch('your-upload-api-endpoint', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const data = await response.json();
      
      // For demonstration purposes, we'll simulate a successful upload
      // Replace this with your actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the provided callback with the uploaded image data
      // In a real implementation, you would pass the response from your API
      onAvatarUpload({
        url: previewUrl,
        filename: selectedImage.name,
        fileType: selectedImage.type,
        fileSize: selectedImage.size,
      });
      
      // Reset form after successful upload
      // Uncomment if you want to reset after upload
      // setSelectedImage(null);
      // setPreviewUrl(null);
      
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="avatar-upload-container">
      <h2>Upload Profile Picture</h2>
      
      <form onSubmit={handleSubmit} className="avatar-upload-form">
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
          >
            Select Image
          </button>
          
          <button 
            type="submit" 
            className="upload-button"
            disabled={!selectedImage || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Avatar'}
          </button>
        </div>
        
        {error && <p className="error-message">{error}</p>}
        
        <p className="help-text">
          Supported formats: JPEG, PNG, GIF, WEBP. Maximum size: {maxSizeInMB}MB
        </p>
      </form>
    </div>
  );
};

export default AvatarUploadForm;