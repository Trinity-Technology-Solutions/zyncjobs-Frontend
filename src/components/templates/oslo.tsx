import React from "react";

const TemplateOslo = ({ data }) => {
  return (
    <div style={{
      fontFamily: "Inter",
      maxWidth: "900px",
      margin: "auto",
      background: "#FFFFFF"
    }}>

      {/* DARK HEADER */}
      <div style={{
        background: "#333333",
        color: "white",
        padding: "30px",
        textAlign: "center",
        position: "relative"
      }}>

        <div style={{
          width: "110px",
          height: "110px",
          borderRadius: "50%",
          overflow: "hidden",
          border: "4px solid #555",
          margin: "auto"
        }}>
          <img
            src={data.photoURL}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <h1 style={{ margin: "10px 0 0 0" }}>
          {data.firstName} {data.lastName}
        </h1>
        <p style={{ marginTop: "5px", fontSize: "14px" }}>{data.jobTitle}</p>

        <p style={{ marginTop: "10px" }}>
          {data.email} • {data.address} • {data.phone}
        </p>
      </div>

      {/* CONTENT BODY */}
      <div style={{ padding: "40px" }}>
        
        <h2>Profile</h2>
        <p>{data.summary}</p>

        <h2 style={{ marginTop: "30px" }}>Employment History</h2>
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginTop: "20px" }}>
            <p><b>{exp.role}</b>, {exp.company}, {exp.location}</p>
            <p style={{ fontStyle: "italic" }}>{exp.start} — {exp.end}</p>
            <ul>
              {exp.details.map((d, j) => <li key={j}>{d}</li>)}
            </ul>
          </div>
        ))}

        <h2 style={{ marginTop: "30px" }}>Education</h2>
        {data.education.map((edu, i) => (
          <div key={i} style={{ marginTop: "15px" }}>
            <p><b>{edu.degree}</b></p>
            <p>{edu.school}, {edu.location}</p>
            <p style={{ fontStyle: "italic" }}>{edu.start} — {edu.end}</p>
            {edu.description && <p style={{ marginTop: "8px" }}>{edu.description}</p>}
          </div>
        ))}

        <h2 style={{ marginTop: "30px" }}>Skills</h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginTop: "10px"
        }}>
          {data.skills.map((s, i) => (
            <div key={i}>
              <p>{s}</p>
              <div style={{
                width: "100%",
                height: "5px",
                background: "#333"
              }}></div>
            </div>
          ))}
        </div>

        <h2 style={{ marginTop: "30px" }}>References</h2>
        {data.references?.map((ref, i) => (
          <p key={i}>{ref}</p>
        ))}
      </div>

    </div>
  );
};

export default TemplateOslo;
