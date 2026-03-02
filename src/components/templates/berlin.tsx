import React from "react";

const TemplateBerlin = ({ data }) => {
  return (
    <div style={{ fontFamily: "Inter", maxWidth: "850px", margin: "auto", padding: "30px" }}>

      <h1 style={{ fontSize: "36px", marginBottom: "5px" }}>
        {data.firstName} {data.lastName}
      </h1>
      <div style={{ fontSize: "18px", marginBottom: "20px" }}>{data.jobTitle}</div>

      <div style={{ display: "grid", gridTemplateColumns: "30% 70%", gap: "40px" }}>
        
        {/* LEFT SIDEBAR */}
        <div style={{ borderRight: "2px solid #eee", paddingRight: "20px" }}>
          <h3>DETAILS</h3>
          <p>{data.address}<br />{data.city}<br />{data.country}</p>
          <p><b>Phone:</b> {data.phone}</p>
          <p><b>Email:</b> {data.email}</p>
          <p><b>Nationality:</b> {data.nationality}</p>

          <h3>SKILLS</h3>
          {data.skills.map((s, i) => (
            <div key={i}>
              <p>{s}</p>
              <div style={{ width: "100%", height: "5px", background: "#ddd" }}></div>
            </div>
          ))}

          <h3>LANGUAGES</h3>
          {data.languages.map((lang, i) => (
            <div key={i}>
              <p>{lang}</p>
              <div style={{ width: "100%", height: "5px", background: "#ddd" }}></div>
            </div>
          ))}
        </div>

        {/* RIGHT CONTENT */}
        <div>
          <h3>PROFILE</h3>
          <p>{data.summary}</p>

          <h3>EMPLOYMENT HISTORY</h3>

          {data.experience.map((exp, i) => (
            <div key={i}>
              <p><b>{exp.role}, {exp.company}</b> — {exp.location}<br />{exp.start} — {exp.end}</p>
              <ul>
                {exp.details.map((detail, j) => (
                  <li key={j}>{detail}</li>
                ))}
              </ul>
            </div>
          ))}

          <h3>EDUCATION</h3>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: "15px" }}>
              <p>
                <b>{edu.degree}</b><br />
                {edu.school}, {edu.location}<br />
                {edu.start} — {edu.end}
              </p>
              {edu.description && <p style={{ marginTop: "8px", fontSize: "14px" }}>{edu.description}</p>}
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};

export default TemplateBerlin;
