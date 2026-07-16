import React, { useState } from "react";
import PropTypes from "prop-types";
import "./LearningArea.css";

function LearningArea({ curriculum }) {
  const [activeTab, setActiveTab] = useState("theory");
  const [expandedTheory, setExpandedTheory] = useState(null);

  const filteredItems = curriculum.filter((item) => item.type === activeTab);

  // Helper to extract YouTube video ID and construct a safe iframe embed URL
  const getEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes("embed")) return url;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
  };

  return (
    <div className="learning-area animate-fade-in">
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === "theory" ? "active" : ""}`}
          onClick={() => setActiveTab("theory")}
        >
          Theory & Texts
        </button>
        <button
          className={`tab-btn ${activeTab === "mudra" ? "active" : ""}`}
          onClick={() => setActiveTab("mudra")}
        >
          Mudra Gallery
        </button>
        <button
          className={`tab-btn ${activeTab === "adavu" ? "active" : ""}`}
          onClick={() => setActiveTab("adavu")}
        >
          Adavu Steps
        </button>
      </div>

      <div className="tab-content">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <p className="no-data">
              No content has been added to this section yet.
            </p>
          </div>
        ) : (
          <div className={`grid-layout ${activeTab}-grid`}>
            {activeTab === "theory" &&
              filteredItems.map((item) => (
                <div
                  key={item._id}
                  className={`theory-card ${expandedTheory === item._id ? "expanded" : ""}`}
                  onClick={() =>
                    setExpandedTheory(
                      expandedTheory === item._id ? null : item._id,
                    )
                  }
                >
                  <h3>{item.title}</h3>
                  <p className="description-text">
                    {expandedTheory === item._id
                      ? item.description
                      : `${item.description.slice(0, 160)}...`}
                  </p>
                  {expandedTheory === item._id && item.videoLink && (
                    <div
                      className="video-container"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <iframe
                        title={item.title}
                        src={getEmbedUrl(item.videoLink)}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                  <div className="expand-indicator">
                    {expandedTheory === item._id
                      ? "▲ Click to collapse"
                      : "▼ Read full text"}
                  </div>
                </div>
              ))}

            {activeTab === "mudra" &&
              filteredItems.map((item) => (
                <div key={item._id} className="mudra-card">
                  <div className="card-details">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                  {item.videoLink && (
                    <div className="video-container">
                      <iframe
                        title={item.title}
                        src={getEmbedUrl(item.videoLink)}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                </div>
              ))}

            {activeTab === "adavu" &&
              filteredItems.map((item) => (
                <div key={item._id} className="adavu-card">
                  <div className="card-details">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                  {item.videoLink && (
                    <div className="video-container">
                      <iframe
                        title={item.title}
                        src={getEmbedUrl(item.videoLink)}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

LearningArea.propTypes = {
  curriculum: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      videoLink: PropTypes.string,
      imageLink: PropTypes.string,
    }),
  ).isRequired,
};

export default LearningArea;
