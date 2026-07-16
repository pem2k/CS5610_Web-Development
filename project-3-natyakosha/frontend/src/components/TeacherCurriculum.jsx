import React, { useState } from "react";
import PropTypes from "prop-types";
import "./TeacherCurriculum.css";

function TeacherCurriculum({ curriculum, onRefresh }) {
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    type: "theory",
    description: "",
    imageLink: "",
    videoLink: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setFormData({
      id: "",
      title: "",
      type: "theory",
      description: "",
      imageLink: "",
      videoLink: "",
    });
    setIsEditing(false);
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.title || !formData.description || !formData.type) {
      setErrorMessage("Title, description, and type are required.");
      return;
    }

    const endpoint = isEditing
      ? `/api/curriculum/${formData.id}`
      : "/api/curriculum";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save item.");
      }

      setSuccessMessage(
        isEditing
          ? "Curriculum item updated successfully!"
          : "Curriculum item created successfully!",
      );
      handleReset();
      onRefresh();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      id: item._id,
      title: item.title,
      type: item.type,
      description: item.description,
      imageLink: item.imageLink || "",
      videoLink: item.videoLink || "",
    });
    setIsEditing(true);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this curriculum item?")
    )
      return;
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/curriculum/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete item.");
      }

      setSuccessMessage("Curriculum item deleted successfully.");
      onRefresh();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="teacher-curriculum animate-fade-in">
      <header className="section-header">
        <h2>Curriculum Creator & Editor</h2>
      </header>

      <div className="two-column-layout">
        {/* Editor Form */}
        <div className="card form-card">
          <h3>{isEditing ? "Edit Item" : "Create New Curriculum Item"}</h3>

          {errorMessage && (
            <div className="alert error">
              <span>{errorMessage}</span>
              <button
                type="button"
                className="alert-close-btn"
                onClick={() => setErrorMessage("")}
              >
                ✕
              </button>
            </div>
          )}
          {successMessage && (
            <div className="alert success">
              <span>{successMessage}</span>
              <button
                type="button"
                className="alert-close-btn"
                onClick={() => setSuccessMessage("")}
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="custom-form">
            <div className="form-group">
              <label>Title / Name</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Tatta Adavu"
                autoComplete="off"
                required
              />
            </div>

            <div className="form-group">
              <label>Item Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="theory">Theory & Text</option>
                <option value="mudra">Mudra Gesture</option>
                <option value="adavu">Adavu Step</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description / Explanation</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="6"
                placeholder="Provide directions, step breakdowns, or historical origins..."
                required
              ></textarea>
            </div>

            {formData.type === "mudra" && (
              <div className="form-group">
                <label>Image Link (URL)</label>
                <input
                  type="text"
                  name="imageLink"
                  value={formData.imageLink}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/..."
                  autoComplete="off"
                />
              </div>
            )}

            <div className="form-group">
              <label>YouTube Video Link (URL)</label>
              <input
                type="text"
                name="videoLink"
                value={formData.videoLink}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=..."
                autoComplete="off"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {isEditing ? "Save Changes" : "Create Item"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleReset}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Curriculum Directory List */}
        <div className="card list-card">
          <h3>Curriculum Directory ({curriculum.length})</h3>
          <div className="item-list-container">
            {curriculum.length === 0 ? (
              <p className="no-data">No items found.</p>
            ) : (
              curriculum.map((item) => (
                <div key={item._id} className="curriculum-list-item">
                  <div className="item-meta">
                    <span className={`badge badge-${item.type}`}>
                      {item.type}
                    </span>
                    <h4>{item.title}</h4>
                  </div>
                  <div className="item-buttons">
                    <button
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

TeacherCurriculum.propTypes = {
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
  onRefresh: PropTypes.func.isRequired,
};

export default TeacherCurriculum;
