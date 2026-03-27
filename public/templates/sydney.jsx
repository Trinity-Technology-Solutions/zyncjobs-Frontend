import React from "react";

const Sydney = ({ data }) => {
  return (
    <div style={{ fontFamily: "Arial", padding: "40px", maxWidth: "900px", margin: "auto" }}>
      <h1 style={{ fontSize: "40px", fontWeight: "bold" }}>{data.name}</h1>
      <h3 style={{ marginTop: "-10px", color: "#444" }}>{data.profession}</h3>
      <div style={{ color: "#666" }}>
        {data.contact.address} • {data.contact.phone} • {data.contact.email}
      </div>

      <h2 style={{ marginTop: "40px" }}>Profile</h2>
      <p style={{ lineHeight: "1.6" }}>{data.profile}</p>

      <h2 style={{ marginTop: "40px" }}>Experience</h2>
      {data.experience.map((exp, idx) => (
        <div key={idx} style={{ marginBottom: "20px" }}>
          <strong>{exp.title}</strong> — {exp.company}
          <div style={{ color: "#777" }}>{exp.start} — {exp.end}</div>
          <ul>
            {exp.details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      ))}

      <h2 style={{ marginTop: "40px" }}>Skills</h2>
      <ul>
        {data.skills.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>

      <h2 style={{ marginTop: "40px" }}>Education</h2>
      {data.education.map((edu, idx) => (
        <div key={idx} style={{ marginBottom: "15px" }}>
          <strong>{edu.degree}</strong> — {edu.school}
          <div style={{ color: "#555" }}>{edu.start} — {edu.end}</div>
        </div>
      ))}
    </div>
  );
};

export default Sydney;
