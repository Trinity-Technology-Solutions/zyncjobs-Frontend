import React from "react";

const TemplatePrague = ({ data }) => {
  return (
    <div
      style={{
        fontFamily: "Inter",
        maxWidth: "900px",
        margin: "auto",
        padding: "40px",
        background: "#FFFFFF"
      }}
    >
      {/* HEADER */}
      <div>
        <h1 style={{ marginBottom: "5px", color: "#b35426" }}>
          {data.firstName} {data.lastName}
        </h1>
        <p style={{ fontSize: "16px", marginBottom: "10px" }}>{data.jobTitle}</p>

        <p style={{ fontSize: "14px", color: "#555" }}>
          {data.email} • {data.phone} • {data.address}, {data.city}, {data.country}
        </p>
      </div>

      {/* PROFILE */}
      <p style={{ marginTop: "25px", lineHeight: "1.6" }}>{data.summary}</p>

      {/* EXPERIENCE */}
      <h2
        style={{
          marginTop: "35px",
          color: "#c46f32",
          borderBottom: "1px solid #ddd",
          paddingBottom: "5px"
        }}
      >
        Career Experience
      </h2>

      {data.experience.map((exp, i) => (
        <div key={i} style={{ marginTop: "25px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "14px",
              color: "#c46f32"
            }}
          >
            <p>{exp.company}</p>
            <p>
              {exp.start} — {exp.end}
            </p>
          </div>
          <p style={{ fontWeight: "bold" }}>{exp.role}</p>
          <ul>
            {exp.details.map((d, j) => (
              <li key={j}>{d}</li>
            ))}
          </ul>
        </div>
      ))}

      {/* EDUCATION */}
      <h2
        style={{
          marginTop: "35px",
          color: "#c46f32",
          borderBottom: "1px solid #ddd",
          paddingBottom: "5px"
        }}
      >
        Education
      </h2>

      {data.education.map((edu, i) => (
        <div key={i} style={{ marginTop: "20px" }}>
          <p style={{ fontWeight: "bold" }}>{edu.degree}</p>
          <p>
            {edu.school}, {edu.location}
          </p>
          <p style={{ fontSize: "14px" }}>
            {edu.start} — {edu.end}
          </p>
        </div>
      ))}

      {/* TECHNICAL SKILLS */}
      <h2
        style={{
          marginTop: "35px",
          color: "#c46f32",
          borderBottom: "1px solid #ddd",
          paddingBottom: "5px"
        }}
      >
        Technical Proficiencies
      </h2>

      {data.skills.map((skill, i) => (
        <p key={i} style={{ marginTop: "10px" }}>
          {skill}
        </p>
      ))}
    </div>
  );
};

export default TemplatePrague;
