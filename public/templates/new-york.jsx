import React from "react";

const NewYork = ({ data }) => {
  return (
    <div style={{ fontFamily: "Helvetica", padding: "45px", maxWidth: "900px", margin: "auto" }}>
      <h1 style={{ fontSize: "42px", fontWeight: "bold" }}>{data.name}</h1>
      <h3 style={{ marginTop: "-10px", color: "#333" }}>{data.profession}</h3>
      <div style={{ color: "#555" }}>
        {data.contact.address} • {data.contact.phone} • {data.contact.email}
      </div>

      <h2 style={{ marginTop: "40px" }}>Profile</h2>
      <p style={{ lineHeight: "1.7" }}>{data.profile}</p>

      <h2 style={{ marginTop: "40px" }}>Employment History</h2>
      {data.experience.map((exp, idx) => (
        <div key={idx} style={{ marginBottom: "25px" }}>
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

export default NewYork;
