import React, { useState, useRef } from 'react';
import Upload from './components/Upload';
import Record from './components/Record';
 
const App = () => {
    // State variables to manage the application's state
    const [recording, setRecording] = useState(false); // True if audio is currently being recorded
    const [transcription, setTranscription] = useState(''); // Stores the transcribed text
    const [loading, setLoading] = useState(false); // True if transcription is in progress
    const [error, setError] = useState(''); // Stores any error messages
    const [selectedFile, setSelectedFile] = useState(null); // Stores the selected audio file for upload
    const mediaRecorderRef = useRef(null); // Ref to hold the MediaRecorder instance
    const audioChunksRef = useRef([]); // Ref to store chunks of audio data
    const fileInputRef = useRef(null); // Ref to the file input element

    const VITE_API_KEY = import.meta.env.VITE_API_KEY;

    // Function to convert ArrayBuffer to Base64 string
    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    // Function to start audio recording
    const startRecording = async () => {
        setError(''); // Clear any previous errors
        setTranscription(''); // Clear previous transcription
        setSelectedFile(null); // Clear any selected file
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear file input
        }
        try {
            // Request access to the user's microphone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = []; // Reset audio chunks

            // Event listener for when data is available from the recorder
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            // Event listener for when recording stops
            mediaRecorderRef.current.onstop = async () => {
                // Create a Blob from the collected audio chunks
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // Convert Blob to ArrayBuffer
                const arrayBuffer = await audioBlob.arrayBuffer();
                // Convert ArrayBuffer to Base64 string
                const base64Audio = arrayBufferToBase64(arrayBuffer);
                // Call the transcription function with the Base64 audio and its MIME type
                await transcribeAudio(base64Audio, 'audio/webm');

                // Stop all tracks in the media stream to release the microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start(); // Start the recording
            setRecording(true); // Update recording state
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Could not access microphone. Please ensure it is connected and permissions are granted.');
        }
    };

    // Function to stop audio recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop(); // Stop the recording
            setRecording(false); // Update recording state
        }
    };

    // Function to handle file selection
    const handleFileChange = (event) => {
        setError(''); // Clear any previous errors
        setTranscription(''); // Clear previous transcription
        setRecording(false); // Ensure recording is stopped if a file is selected
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
             mediaRecorderRef.current.stop();
        }
        const file = event.target.files[0];
        if (file) {
            // Check file type
            if (!file.type.startsWith('audio/')) {
                setError('Please select an audio file (e.g., MP3, WAV).');
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
    };

    // Function to handle file upload and transcription
    const handleUploadAndTranscribe = async () => {
      
        if (!selectedFile) {
            setError('Please select an audio file to upload.');
            return;
        }

        setLoading(true); // Set loading state to true
        setError(''); // Clear any previous errors
        setTranscription(''); // Clear previous transcription

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                // The result is a data URL (e.g., "data:audio/mpeg;base64,...")
                // We need to extract only the Base64 part
                const base64Audio = reader.result.split(',')[1];
                await transcribeAudio(base64Audio, selectedFile.type);
            } catch (err) {
                console.error('Error reading file:', err);
                setError('Failed to read the audio file.');
            } finally {
                setLoading(false); // Set loading state to false
            }
        };
        reader.onerror = () => {
            setLoading(false);
            setError('Failed to read the audio file.');
        };
        reader.readAsDataURL(selectedFile); // Read the file as a Data URL
    };

    // Function to send audio data to the LLM for transcription
    const transcribeAudio = async (base64Audio, mimeType) => {
        setLoading(true); // Set loading state to true
        setError(''); // Clear any previous errors

        try {
            // Construct the chat history payload for the Gemini API
            const chatHistory = [
                {
                    role: 'user',
                    parts: [
                        { text: 'Transcribe the following audio:' },
                        {
                            inlineData: {
                                mimeType: mimeType, // Specify the MIME type of the audio
                                data: base64Audio // The Base64 encoded audio data
                            }
                        }
                    ]
                }
            ];

            // Define the payload for the API request
            const payload = { contents: chatHistory };
            const apiKey = VITE_API_KEY; // API key for Gemini API (will be provided by Canvas runtime)
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            // Make the fetch call to the Gemini API
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json(); // Parse the JSON response

            // Check if the response contains valid transcription
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setTranscription(text); // Set the transcribed text
            } else {
                setError('No transcription found or unexpected response structure.');
                console.error('Unexpected API response:', result);
            }
        } catch (err) {
            console.error('Error during transcription:', err);
            setError('Failed to transcribe audio. Please try again.');
        } finally {
            setLoading(false); // Set loading state to false
        }
    };

    const handleDownload = () => {
      console.log('Selected file:', selectedFile);
    if (transcription && window.jspdf && window.jspdf.jsPDF) {
        const doc = new window.jspdf.jsPDF();
        doc.text(transcription, 10, 10); // Add the transcription text to the PDF
        doc.save(selectedFile.name.replace('.mp3', "") || 'transcription.pdf'); // Save the PDF with a filename
    } else if (transcription) {
        // Fallback to text download if jsPDF is not loaded
        const blob = new Blob([transcription], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedFile.name || 'transcription.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setError('jsPDF library not loaded. Downloading as plain text.');
    }
};

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center p-4 font-inter">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-5xl transform transition-all duration-300 ">
          <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                  Audio Transcription
              </span>
          </h1>

                <p className="text-center text-gray-600 mb-6">
                    Record audio or upload an MP3/WAV file to get your transcription.
                </p>

                {/* Recording Section */}
                <Record  recording={recording} startRecording={startRecording} stopRecording={stopRecording} />

                {/* Upload Section */}
                <Upload 
                handleFileChange={handleFileChange}
                 fileInputRef={fileInputRef} 
                 selectedFile={selectedFile}
                  handleUploadAndTranscribe={handleUploadAndTranscribe}
                   loading={loading}
                    />


                {loading && (
                    <div className="flex justify-center items-center mb-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        <p className="ml-3 text-lg text-purple-700">Transcribing audio...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6" role="alert">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                )}

                {transcription && (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-inner">
                        <h2 className="text-2xl font-bold text-gray-700 mb-4">Transcription:</h2>
                       
                        <button
                            onClick={handleDownload}
                            className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        >
                            <i className="fas fa-download mr-2"></i> Download Pdf
                        </button>

                        <p className="text-gray-800 mt-5 leading-relaxed whitespace-pre-wrap">{transcription}</p>
                    </div>
                )}
            </div>
         
        </div>
    );
};

export default App;
