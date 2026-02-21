import "./index.css";

export function LoadingScreen({ isLoading }) {
  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <img src="/inoutLogo.svg" alt="Inout Logo" className="loading-logo" />
        <div className="loading-text-box">
          <span className="loading-loader" />
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    </div>
  );
}
