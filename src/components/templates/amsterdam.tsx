import React from "react";

const TemplateAmsterdam = ({ data }) => {
  return (
    <div style={{
      fontFamily: "Inter",
      maxWidth: "900px",
      margin: "auto",
      background: "#FFFFFF",
      display: "grid",
      gridTemplateColumns: "28% 72%",
      borderLeft: "1px solid #f0f0f0"
    }}>

      {/* LEFT SIDEBAR */}
      <div style={{ background: "#f7f7f7", padding: "40px" }}>
        
        {/* DETAILS */}
        <h3 style={{ fontSize: "14px", letterSpacing: "1px" }}>DETAILS</h3>
        
        <p style={{ fontSize: "13px", marginTop: "20px" }}>
          <b>ADDRESS</b><br />
          {data.address}<br />
          {data.city}<br />
          {data.country}
        </p>

        <p style={{ fontSize: "13px", marginTop: "20px" }}>
          <b>PHONE</b><br />
          {data.phone}
        </p>

        <p style={{ fontSize: "13px", marginTop: "20px" }}>
          <b>EMAIL</b><br />
          {data.email}
        </p>

        {/* SKILLS */}
        <h3 style={{ marginTop: "40px" }}>SKILLS</h3>
        
        {data.skills.map((skill, i) => (
          <div key={i} style={{ marginTop: "15px" }}>
            <p style={{ marginBottom: "5px" }}>{skill}</p>
            <div style={{ display: "flex", gap: "5px" }}>
              {Array(5).fill().map((_, j) => (
                <div key={j} style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#000"
                }} />
              ))}
            </div>
          </div>
        ))}

      </div>

      {/* MAIN CONTENT */}
      <div style={{ padding: "40px" }}>
        
        {/* HEADER */}
        <div style={{
          border: "2px solid #000",
          padding: "25px",
          textAlign: "center"
        }}>
          <h1 style={{ margin: 0 }}>{data.firstName} {data.lastName}</h1>
          <p style={{ marginTop: "10px" }}>{data.jobTitle}</p>
        </div>

        {/* PROFILE */}
        <h2 style={{ marginTop: "40px", borderBottom: "1px solid #000", paddingBottom: "5px" }}>PROFILE</h2>
        <p>{data.summary}</p>

        {/* EXPERIENCE */}
        <h2 style={{ marginTop: "40px", borderBottom: "1px solid #000", paddingBottom: "5px" }}>
          EMPLOYMENT HISTORY
        </h2>

        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginTop: "25px" }}>
            <p><b>{exp.role}</b>, {exp.company}</p>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <p>{exp.start} — {exp.end}</p>
              <p>{exp.location}</p>
            </div>
            <ul>
              {exp.details.map((d, j) => <li key={j}>{d}</li>)}
            </ul>
          </div>
        ))}

        {/* EDUCATION */}
        <h2 style={{ marginTop: "40px", borderBottom: "1px solid #000", paddingBottom: "5px" }}>
          EDUCATION
        </h2>

        {data.education.map((edu, i) => (
          <div key={i} style={{ marginTop: "15px" }}>
            <p><b>{edu.degree}</b>, {edu.school}</p>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <p>{edu.start} — {edu.end}</p>
              <p>{edu.location}</p>
            </div>
            {edu.description && <p style={{ marginTop: "10px", fontSize: "13px" }}>{edu.description}</p>}
          </div>
        ))}

      </div>
    </div>
  );
};

export default TemplateAmsterdam;
