import React from 'react'

const Record = ({ recording, startRecording, stopRecording }) => {
  return (
    <div className="mb-8 p-6 border border-gray-200 rounded-xl bg-gray-50">
                    <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">Record Audio</h2>
                    <div className="flex justify-center space-x-4">
                        {!recording ? (
                            <button
                                onClick={startRecording}
                                className="px-8 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-300"
                            >
                                <i className="fas fa-microphone mr-2"></i> Start Recording
                            </button>
                        ) : (
                            <button
                                onClick={stopRecording}
                                className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-300"
                            >
                                <i className="fas fa-stop-circle mr-2"></i> Stop Recording
                            </button>
                        )}
                    </div>
                </div>
  )
}

export default Record