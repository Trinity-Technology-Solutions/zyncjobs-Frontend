import React from "react";

const TemplateShanghai = ({ data }) => {
  return (
    <div
      style={{
        fontFamily: "Inter",
        maxWidth: "900px",
        margin: "auto",
        background: "#FFFFFF"
      }}
    >
      {/* TOP GREEN HEADER */}
      <div
        style={{
          background: "#d9e6d1",
          padding: "30px 40px",
          borderRadius: "20px",
          borderBottomLeftRadius: "0",
          borderBottomRightRadius: "0"
        }}
      >
        <h1 style={{ margin: 0, color: "#4a6f42" }}>
          {data.firstName} {data.lastName}
        </h1>
        <p style={{ fontSize: "16px", marginTop: "5px", color: "#5c7d52" }}>
          {data.jobTitle}
        </p>

        <p style={{ marginTop: "10px", color: "#44613f" }}>
          {data.email} • {data.phone}
          <br />
          {data.address}, {data.city}, {data.country}
        </p>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ padding: "40px" }}>
        <p style={{ lineHeight: "1.6" }}>{data.summary}</p>

        {/* EXPERIENCE */}
        <h2
          style={{
            marginTop: "35px",
            color: "#4a6f42",
            borderBottom: "1px solid #c0d4b5",
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
                fontSize: "15px",
                color: "#4a6f42"
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
            color: "#4a6f42",
            borderBottom: "1px solid #c0d4b5",
            paddingBottom: "5px"
          }}
        >
          Education
        </h2>

        {data.education.map((edu, i) => (
          <div key={i} style={{ marginTop: "20px" }}>
            <p style={{ fontWeight: "bold" }}>{edu.degree}</p>
            <p>{edu.school}</p>
            <p style={{ fontSize: "14px" }}>
              {edu.start} — {edu.end}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateShanghai;
