import React from 'react'

const Upload = ({handleFileChange,fileInputRef,selectedFile,handleUploadAndTranscribe,loading}) => {
  return (
    <div className="mb-8 p-6 border border-gray-200 rounded-xl bg-gray-50">
                    <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">Upload Audio File</h2>
                    <div className="flex flex-col items-center space-y-4">
                        <input
                            type="file"
                            accept="audio/mp3,audio/wav,audio/mpeg,audio/ogg" // Accept common audio formats
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                        {selectedFile && (
                            <p className="text-gray-600 text-sm">Selected file: <span className="font-medium">{selectedFile.name}</span></p>
                        )}
                        <button
                            onClick={handleUploadAndTranscribe}
                            disabled={!selectedFile || loading}
                            className={`px-8 py-3 text-white font-semibold rounded-full shadow-lg transform transition-all duration-300 focus:outline-none focus:ring-4 ${
                                !selectedFile || loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-xl hover:scale-105 focus:ring-blue-300'
                            }`}
                        >
                            <i className="fas fa-upload mr-2"></i> Upload & Transcribe
                        </button>
                    </div>
                </div>
  )
}

export default Upload