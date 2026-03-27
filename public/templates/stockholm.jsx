import React from "react";

const TemplateStockholm = ({ data }) => {
  return (
    <div style={{
      fontFamily: "Inter",
      padding: "40px",
      maxWidth: "900px",
      margin: "auto",
      background: "#FFFFFF"
    }}>

      {/* TOP ROW */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        
        <div>
          <h1 style={{ margin: 0 }}>{data.firstName} {data.lastName}</h1>
          <p style={{ fontSize: "18px" }}>{data.jobTitle}</p>
        </div>

        <div style={{ textAlign: "right" }}>
          <p><b>Details</b></p>
          <p>{data.address}</p>
          <p>{data.city}</p>
          <p>{data.phone}</p>
          <p>{data.email}</p>
        </div>

      </div>

      {/* PROFILE */}
      <h3 style={{ marginTop: "30px", display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ color: "#007BFF" }}>📌</span> Profile
      </h3>
      <p>{data.summary}</p>

      {/* EXPERIENCE */}
      <h3 style={{ marginTop: "30px", display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ color: "#007BFF" }}>💼</span> Employment History
      </h3>

      {data.experience.map((exp, i) => (
        <div key={i} style={{ marginTop: "20px" }}>
          <p><b>{exp.role}</b> at {exp.company}, {exp.location}</p>
          <p style={{ fontStyle: "italic" }}>{exp.start} — {exp.end}</p>
          <ul>
            {exp.details.map((d, j) => <li key={j}>{d}</li>)}
          </ul>
        </div>
      ))}

      {/* EDUCATION */}
      <h3 style={{ marginTop: "30px", display: "flex", gap: "10px" }}>
        <span style={{ color: "#007BFF" }}>🎓</span> Education
      </h3>

      {data.education.map((edu, i) => (
        <p key={i}>
          <b>{edu.degree}</b><br />
          {edu.school}, {edu.location}<br />
          {edu.start} — {edu.end}
        </p>
      ))}

      {/* SKILLS */}
      <h3 style={{ marginTop: "30px" }}>Skills</h3>

      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {data.skills.map((s, i) => (
          <li key={i} style={{
            borderBottom: "2px solid #007BFF",
            width: "200px",
            marginBottom: "10px"
          }}>
            {s}
          </li>
        ))}
      </ul>

      {/* LANGUAGES */}
      <h3 style={{ marginTop: "30px" }}>Languages</h3>
      <p>{data.languages.join(", ")}</p>

    </div>
  );
};

export default TemplateStockholm;
