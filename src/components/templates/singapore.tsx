import React from "react";

const TemplateSingapore = ({ data }) => {
  return (
    <div style={{ fontFamily: "Inter", padding: "40px", maxWidth: "850px", margin: "auto" }}>

      <h1 style={{ fontSize: "36px", margin: 0 }}>
        {data.firstName} {data.lastName}
      </h1>
      <div style={{ fontSize: "18px", marginBottom: "20px" }}>{data.jobTitle}</div>

      <p>
        <b>Address:</b> {data.address}<br />
        <b>Email:</b> {data.email}<br />
        <b>Phone:</b> {data.phone}
      </p>

      <h3 style={{ borderBottom: "2px solid black", paddingBottom: "3px" }}>PROFILE</h3>
      <p>{data.summary}</p>

      <h3 style={{ borderBottom: "2px solid black", paddingBottom: "3px" }}>EMPLOYMENT HISTORY</h3>

      {data.experience.map((exp, i) => (
        <div key={i}>
          <p>
            <b>{exp.start} — {exp.end}</b> &nbsp;
            <b>{exp.role} at {exp.company}</b> — {exp.location}
          </p>
          <ul>
            {exp.details.map((d, j) => (
              <li key={j}>{d}</li>
            ))}
          </ul>
        </div>
      ))}

      <h3 style={{ borderBottom: "2px solid black", paddingBottom: "3px" }}>EDUCATION</h3>

      {data.education.map((edu, i) => (
        <p key={i}>
          <b>{edu.start} — {edu.end}</b><br />
          <b>{edu.degree}</b><br />
          {edu.school}, {edu.location}
        </p>
      ))}

    </div>
  );
};

export default TemplateSingapore;
