import React from "react";

const TemplateLondon = ({ data }) => {
  return (
    <div style={{
      fontFamily: "Georgia, serif",
      maxWidth: "900px",
      margin: "auto",
      padding: "40px",
      background: "#FFFFFF"
    }}>

      {/* HEADER */}
      <h1 style={{ textAlign: "center", margin: 0 }}>
        {data.firstName} {data.lastName}, {data.jobTitle}
      </h1>

      <p style={{ textAlign: "center", marginTop: "5px" }}>
        {data.address} | {data.city}, {data.country} | {data.phone} | {data.email}
      </p>

      <hr style={{ marginTop: "25px", borderTop: "1px solid #000" }} />

      {/* PROFILE */}
      <h2 style={{ marginTop: "20px" }}>PROFILE</h2>
      <p>{data.summary}</p>

      {/* EMPLOYMENT HISTORY */}
      <h2 style={{ marginTop: "30px" }}>EMPLOYMENT HISTORY</h2>

      {data.experience.map((exp, i) => (
        <div key={i} style={{ marginTop: "20px", borderBottom: "1px dotted #aaa", paddingBottom: "15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p><b>{exp.role}</b>, {exp.company}</p>
            <p>{exp.location}</p>
          </div>
          <p style={{ fontStyle: "italic" }}>{exp.start} — {exp.end}</p>
          <ul>
            {exp.details.map((d, j) => <li key={j}>{d}</li>)}
          </ul>
        </div>
      ))}

      {/* EDUCATION */}
      <h2 style={{ marginTop: "30px" }}>EDUCATION</h2>
      {data.education.map((edu, i) => (
        <div key={i} style={{ marginTop: "15px", borderBottom: "1px dotted #aaa", paddingBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p><b>{edu.degree}</b></p>
            <p>{edu.location}</p>
          </div>
          <p>{edu.school}</p>
          <p style={{ fontStyle: "italic" }}>{edu.start} — {edu.end}</p>
        </div>
      ))}

      {/* SKILLS */}
      <h2 style={{ marginTop: "30px" }}>SKILLS</h2>
      <table style={{ width: "100%", marginTop: "10px" }}>
        {data.skills.map((skill, i) => (
          <tr key={i}>
            <td style={{ padding: "5px 0" }}>{skill}</td>
            <td style={{ textAlign: "right" }}>Expert</td>
          </tr>
        ))}
      </table>

      {/* REFERENCES */}
      <h2 style={{ marginTop: "30px" }}>REFERENCES</h2>
      {data.references?.map((ref, i) => (
        <p key={i}>{ref}</p>
      ))}

    </div>
  );
};

export default TemplateLondon;
