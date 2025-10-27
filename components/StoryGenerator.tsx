import React, { useState, useCallback } from 'react';
import { generateStoryFromImage, textToSpeech } from '../services/geminiService';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { fileToBase64 } from '../utils/fileUtils';

const StoryGenerator: React.FC = () => {
  const [image, setImage] = useState<{ file: File; previewUrl: string; mimeType: string } | null>(null);
  const [story, setStory] = useState<string>('');
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { playAudio, isPlaying } = useAudioPlayer();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setStory('');
      setError(null);
      setImage({
        file,
        previewUrl: URL.createObjectURL(file),
        mimeType: file.type,
      });
    } else {
      setError("Please select a valid image file.");
    }
  };

  const handleGenerateStory = useCallback(async () => {
    if (!image) return;
    setIsLoadingStory(true);
    setStory('');
    setError(null);
    try {
      const base64Data = await fileToBase64(image.file);
      const generatedStory = await generateStoryFromImage(base64Data, image.mimeType);
      setStory(generatedStory);
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoadingStory(false);
    }
  }, [image]);

  const handleReadAloud = useCallback(async () => {
    if (!story) return;
    setIsLoadingAudio(true);
    setError(null);
    try {
      const audioData = await textToSpeech(story);
      await playAudio(audioData);
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoadingAudio(false);
    }
  }, [story, playAudio]);

  return (
    <div className="bg-slate-800 p-6 sm:p-8 rounded-lg shadow-2xl space-y-6">
      {!image ? <ImageUploader onChange={handleFileChange} /> : <ImagePreview src={image.previewUrl} />}
      
      {image && (
        <div className="flex justify-center">
          <button
            onClick={handleGenerateStory}
            disabled={isLoadingStory}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            {isLoadingStory ? (
              <>
                <Spinner /> Generating...
              </>
            ) : (
              <>
                <SparklesIcon /> Generate Story
              </>
            )}
          </button>
        </div>
      )}

      {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</div>}

      {story && (
        <div className="pt-6 border-t border-slate-700 space-y-4">
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{story}</p>
          <div className="flex justify-center">
            <button
              onClick={handleReadAloud}
              disabled={isLoadingAudio || isPlaying}
              className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-900 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              {isLoadingAudio ? <Spinner/> : isPlaying ? <SpeakerWaveIcon /> : <SpeakerIcon />}
              {isLoadingAudio ? "Preparing..." : isPlaying ? "Playing..." : "Read Aloud"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ImageUploader: React.FC<{ onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ onChange }) => (
  <div className="border-2 border-dashed border-slate-600 hover:border-purple-500 transition-colors duration-300 rounded-lg p-8 text-center cursor-pointer">
    <label htmlFor="file-upload" className="flex flex-col items-center gap-2 text-slate-400 cursor-pointer">
      <PhotoIcon />
      <span className="font-semibold">Upload an image</span>
      <span className="text-sm">PNG, JPG, GIF up to 10MB</span>
    </label>
    <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={onChange} />
  </div>
);

const ImagePreview: React.FC<{ src: string }> = ({ src }) => (
  <div className="flex justify-center">
    <img src={src} alt="Story inspiration" className="max-h-80 w-auto rounded-lg shadow-lg" />
  </div>
);

const SparklesIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m1-12a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1V6z" /></svg>;
const PhotoIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const SpeakerIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 18a3 3 0 01-3-3V9a3 3 0 016 0v6a3 3 0 01-3 3z" /></svg>;
const SpeakerWaveIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M12.23 1.385a.75.75 0 0 0-1.06 0L4.293 8.25H2.25a.75.75 0 0 0-.75.75v6c0 .414.336.75.75.75h2.043l6.877 6.865a.75.75 0 0 0 1.06 0l.354-.353a.75.75 0 0 0 0-1.06L9.84 15.75h.01a.75.75 0 0 0 0-1.5h-.01L12.583 3.51a.75.75 0 0 0 0-1.062l-.354-.353ZM15.93 4.312a.75.75 0 0 1 .168 1.044A6.75 6.75 0 0 1 14.25 12a6.75 6.75 0 0 1-1.848 6.644.75.75 0 1 1-1.212-.888A5.25 5.25 0 0 0 12.75 12a5.25 5.25 0 0 0-1.44-3.756.75.75 0 1 1 1.212-.888A6.712 6.712 0 0 1 15.93 4.312Zm3.428-2.68a.75.75 0 0 1 .132 1.052A11.25 11.25 0 0 1 16.5 12a11.25 11.25 0 0 1-2.99 8.316.75.75 0 1 1-1.184-.928A9.75 9.75 0 0 0 15 12a9.75 9.75 0 0 0-2.584-6.752.75.75 0 1 1 1.184-.928A11.19 11.19 0 0 1 19.357 1.632Z" clipRule="evenodd" /></svg>;
const Spinner: React.FC = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

export default StoryGenerator;
