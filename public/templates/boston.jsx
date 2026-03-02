import React from "react";

const Boston = ({ data }) => {
  return (
    <div style={{ fontFamily: "Arial", padding: "40px", maxWidth: "900px", margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: "42px", fontWeight: "bold" }}>{data.name}</h1>
        <img
          src={data.photo}
          alt="profile"
          style={{ width: "140px", height: "140px", borderRadius: "8px", objectFit: "cover" }}
        />
      </div>

      <h3 style={{ marginTop: "-10px", color: "#555" }}>{data.profession}</h3>

      {/* Contact */}
      <div style={{ marginTop: "20px", color: "#555", fontSize: "14px" }}>
        {data.contact.address} • {data.contact.phone} • {data.contact.email}
      </div>

      {/* Profile */}
      <h2 style={{ marginTop: "40px", fontSize: "20px" }}>Profile</h2>
      <p style={{ color: "#333", lineHeight: "1.6" }}>{data.profile}</p>

      {/* Experience */}
      <h2 style={{ marginTop: "40px", fontSize: "20px" }}>Employment History</h2>
      {data.experience.map((exp, idx) => (
        <div key={idx} style={{ marginBottom: "25px" }}>
          <strong>{exp.title}</strong> — {exp.company}
          <div style={{ color: "#555" }}>{exp.start} — {exp.end}</div>
          <ul>
            {exp.details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      ))}

      {/* Skills */}
      <h2 style={{ marginTop: "40px", fontSize: "20px" }}>Skills</h2>
      <ul>
        {data.skills.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>

      {/* Education */}
      <h2 style={{ marginTop: "40px", fontSize: "20px" }}>Education</h2>
      {data.education.map((edu, idx) => (
        <div key={idx} style={{ marginBottom: "15px" }}>
          <strong>{edu.degree}</strong> — {edu.school}
          <div style={{ color: "#555" }}>{edu.start} — {edu.end}</div>
        </div>
      ))}
    </div>
  );
};

export default Boston;
