import React from "react";

const TemplateParis = ({ data }) => {
  return (
    <div style={{
      fontFamily: "Georgia, serif",
      maxWidth: "900px",
      margin: "auto",
      padding: "40px",
      background: "#FFFFFF"
    }}>

      {/* HEADER */}
      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{
          width: "110px",
          height: "110px",
          borderRadius: "6px",
          overflow: "hidden"
        }}>
          <img src={data.photoURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div>
          <h1 style={{ margin: 0 }}>{data.firstName} {data.lastName}, {data.jobTitle}</h1>
          <p style={{ marginTop: "10px" }}>
            {data.address} — {data.city} — {data.country}<br />
            {data.email} — {data.phone}
          </p>
        </div>
      </div>

      {/* RIGHT SKILLS */}
      <div style={{ position: "absolute", right: "80px", top: "200px" }}>
        <h3 style={{ color: "#C24343" }}>SKILLS</h3>
        {data.skills.map((s, i) => (
          <p key={i} style={{ borderBottom: "2px solid #C24343", width: "180px", paddingBottom: "5px" }}>
            {s}
          </p>
        ))}
      </div>

      {/* PROFILE */}
      <h2 style={{ marginTop: "40px", color: "#C24343" }}>PROFILE</h2>
      <p>{data.summary}</p>

      {/* EXPERIENCE */}
      <h2 style={{ marginTop: "40px", color: "#C24343" }}>EMPLOYMENT HISTORY</h2>

      {data.experience.map((exp, i) => (
        <div key={i} style={{ marginTop: "25px" }}>
          <p><b>{exp.role}</b>, {exp.company}</p>
          <p style={{ fontStyle: "italic" }}>{exp.start} — {exp.end}, {exp.location}</p>
          <ul>
            {exp.details.map((d, j) => <li key={j}>{d}</li>)}
          </ul>
        </div>
      ))}

      {/* EDUCATION */}
      <h2 style={{ marginTop: "40px", color: "#C24343" }}>EDUCATION</h2>

      {data.education.map((edu, i) => (
        <div key={i} style={{ marginTop: "20px" }}>
          <p><b>{edu.degree}</b></p>
          <p>{edu.school}, {edu.location}</p>
          <p style={{ fontStyle: "italic" }}>{edu.start} — {edu.end}</p>
        </div>
      ))}

    </div>
  );
};

export default TemplateParis;
