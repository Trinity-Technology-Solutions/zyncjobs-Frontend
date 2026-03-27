import React from "react";

const Milan = ({ data }) => {
  return (
    <div style={{ fontFamily: "Georgia", padding: "40px", maxWidth: "900px", margin: "auto" }}>
      <div style={{ borderBottom: "2px solid #000", paddingBottom: "20px" }}>
        <h1 style={{ fontSize: "40px" }}>{data.name}</h1>
        <h3 style={{ marginTop: "-10px", color: "#444" }}>{data.profession}</h3>
        <div style={{ color: "#666", fontSize: "14px" }}>
          {data.contact.address} • {data.contact.phone} • {data.contact.email}
        </div>
      </div>

      <h2 style={{ marginTop: "40px" }}>Profile</h2>
      <p style={{ lineHeight: "1.7" }}>{data.profile}</p>

      <h2 style={{ marginTop: "40px" }}>Experience</h2>
      {data.experience.map((exp, i) => (
        <div key={i} style={{ marginBottom: "25px" }}>
          <strong>{exp.title}</strong> — {exp.company}
          <div style={{ color: "#777" }}>{exp.start} — {exp.end}</div>
          <ul>
            {exp.details.map((d, j) => (
              <li key={j}>{d}</li>
            ))}
          </ul>
        </div>
      ))}

      <h2 style={{ marginTop: "40px" }}>Skills</h2>
      <ul>
        {data.skills.map((skill, i) => (
          <li key={i}>{skill}</li>
        ))}
      </ul>

      <h2 style={{ marginTop: "40px" }}>Education</h2>
      {data.education.map((edu, i) => (
        <div key={i} style={{ marginBottom: "15px" }}>
          <strong>{edu.degree}</strong> — {edu.school}
          <div>{edu.start} — {edu.end}</div>
        </div>
      ))}
    </div>
  );
};

export default Milan;
