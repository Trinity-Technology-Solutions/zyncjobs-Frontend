import React from "react";

const TemplateSantiago = ({ data }) => {
  return (
    <div style={{
      fontFamily: "Georgia, serif",
      maxWidth: "900px",
      margin: "auto",
      padding: "40px",
      background: "#FFFFFF"
    }}>

      {/* HEADER */}
      <h1 style={{
        textAlign: "center",
        margin: 0,
        letterSpacing: "1px"
      }}>
        {data.firstName} {data.lastName}
      </h1>

      <p style={{
        textAlign: "center",
        fontStyle: "italic",
        marginTop: "5px"
      }}>
        {data.jobTitle}
      </p>

      <p style={{ textAlign: "center", marginTop: "10px" }}>
        {data.address}, {data.city}, {data.country}
      </p>

      <p style={{ textAlign: "center", marginTop: "5px" }}>
        {data.phone} • {data.email}
      </p>

      <div style={{
        height: "2px",
        background: "#E2E2E2",
        margin: "30px 0"
      }}></div>

      {/* PROFILE */}
      <div style={{
        background: "#F4F4F4",
        padding: "15px 20px",
        borderRadius: "3px"
      }}>
        <h2 style={{ margin: 0, textAlign: "center" }}>PROFILE</h2>
      </div>

      <p style={{ marginTop: "20px" }}>{data.summary}</p>

      {/* EMPLOYMENT HISTORY */}
      <div style={{
        background: "#F4F4F4",
        padding: "15px 20px",
        borderRadius: "3px",
        marginTop: "40px"
      }}>
        <h2 style={{ margin: 0, textAlign: "center" }}>EMPLOYMENT HISTORY</h2>
      </div>

      {data.experience.map((exp, i) => (
        <div key={i} style={{ marginTop: "25px" }}>

          {/* Dot separator row */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "1px dotted #AAA",
            paddingBottom: "5px"
          }}>
            <p><b>{exp.role}</b>, {exp.company}</p>
            <p>{exp.start} — {exp.end}</p>
          </div>

          <p style={{ fontStyle: "italic", marginTop: "5px" }}>{exp.location}</p>

          <ul style={{ marginTop: "10px" }}>
            {exp.details.map((d, j) => <li key={j}>{d}</li>)}
          </ul>
        </div>
      ))}

      {/* EDUCATION */}
      <div style={{
        background: "#F4F4F4",
        padding: "15px 20px",
        borderRadius: "3px",
        marginTop: "40px"
      }}>
        <h2 style={{ margin: 0, textAlign: "center" }}>EDUCATION</h2>
      </div>

      {data.education.map((edu, i) => (
        <div key={i} style={{ marginTop: "20px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "1px dotted #AAA",
            paddingBottom: "5px"
          }}>
            <p><b>{edu.school}</b></p>
            <p>{edu.start} — {edu.end}</p>
          </div>
          <p style={{ fontStyle: "italic" }}>{edu.degree}</p>
          <p style={{ fontStyle: "italic" }}>{edu.location}</p>
        </div>
      ))}

      {/* SKILLS */}
      <div style={{
        background: "#F4F4F4",
        padding: "15px 20px",
        borderRadius: "3px",
        marginTop: "40px"
      }}>
        <h2 style={{ margin: 0, textAlign: "center" }}>SKILLS</h2>
      </div>

      <table style={{ width: "100%", marginTop: "20px" }}>
        {data.skills.map((skill, i) => (
          <tr key={i} style={{ borderBottom: "1px dotted #AAA" }}>
            <td style={{ padding: "8px 0" }}>{skill}</td>
            <td style={{ padding: "8px 0", textAlign: "right", fontStyle: "italic" }}>Expert</td>
          </tr>
        ))}
      </table>

      {/* INTERNSHIPS */}
      <div style={{
        background: "#F4F4F4",
        padding: "15px 20px",
        borderRadius: "3px",
        marginTop: "40px"
      }}>
        <h2 style={{ margin: 0, textAlign: "center" }}>INTERNSHIPS</h2>
      </div>

      {data.internships?.map((int, i) => (
        <p key={i} style={{ marginTop: "20px" }}>
          {int}
        </p>
      ))}

      {/* REFERENCES */}
      <div style={{
        background: "#F4F4F4",
        padding: "15px 20px",
        borderRadius: "3px",
        marginTop: "40px"
      }}>
        <h2 style={{ margin: 0, textAlign: "center" }}>REFERENCES</h2>
      </div>

      {data.references?.map((ref, i) => (
        <p key={i} style={{ marginTop: "15px" }}>{ref}</p>
      ))}

    </div>
  );
};

export default TemplateSantiago;
