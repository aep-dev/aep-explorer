import { useState, useEffect } from 'react';
import { parseOpenAPI } from './openapi';

interface FetcherProps {
  url: string;
  setter: (spec: { spec: OpenAPI | null }) => void;
}

interface UrlInputProps {
  onSubmit: ({spec: OpenAPI}) => void;
}

const Fetcher: React.FC<UrlInputProps> = ({ onSubmit }) => {
  const [inputUrl, setInputUrl] = useState('');

  const handleSubmit = () => {
    if (inputUrl) {
      fetch(inputUrl)
        .then(response => response.text())
        .then(text => {
          const parsed = parseOpenAPI(text);
          onSubmit({spec: parsed});
        })
        .catch(error => {
          console.error("Failed to fetch OpenAPI spec:", error);
        });
    }
  };

  return (
    <div>
      <input
        type="text"
        value={inputUrl}
        onChange={(e) => setInputUrl(e.target.value)}
        placeholder="Enter URL"
      />
      <button onClick={handleSubmit}>Done</button>
    </div>
  );
};


export default Fetcher;
