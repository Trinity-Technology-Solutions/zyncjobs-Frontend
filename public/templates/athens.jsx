import React from "react";
import "./resume.css"; // optional

const TemplateAthens = ({ data }) => {
  return (
    <div className="resume-container" style={{ maxWidth: "850px", margin: "auto", padding: "40px", fontFamily: "Inter" }}>

      <h1 style={{ color: "#2A75DB", fontSize: "36px", margin: 0 }}>
        {data.firstName} {data.lastName}
      </h1>

      <div style={{ color: "#2A75DB", fontSize: "20px", marginTop: "4px" }}>
        {data.jobTitle}
      </div>

      <div style={{ textAlign: "right", color: "#2A75DB", marginTop: "-40px" }}>
        {data.email} • {data.phone}<br />
        {data.city}, {data.country}
      </div>

      <p style={{ marginTop: "20px" }}>{data.summary}</p>

      <h2 style={{ color: "#2A75DB", fontSize: "22px", marginTop: "30px" }}>Professional Experience</h2>

      {data.experience.map((exp, index) => (
        <div key={index}>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px", fontWeight: 600 }}>
            <div>
              <div>{exp.company}</div>
              <div style={{ fontWeight: 500 }}>{exp.role}</div>
            </div>
            <div>{exp.start} — {exp.end}</div>
          </div>

          <ul>
            {exp.details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      ))}

      <h2 style={{ color: "#2A75DB", fontSize: "22px", marginTop: "30px" }}>Education</h2>

      {data.education.map((edu, index) => (
        <p key={index}>
          <b>{edu.degree}</b><br />
          {edu.school}, {edu.location}
        </p>
      ))}

      <h2 style={{ color: "#2A75DB", fontSize: "22px", marginTop: "30px" }}>Skills</h2>

      <ul>
        {data.skills.map((skill, i) => (
          <li key={i}>{skill}</li>
        ))}
      </ul>

    </div>
  );
};

export default TemplateAthens;
