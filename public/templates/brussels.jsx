import React from "react";

const TemplateBrussels = ({ data }) => {
  return (
    <div style={{ fontFamily: "Inter", padding: "40px", maxWidth: "850px", margin: "auto" }}>

      <h1 style={{ color: "#D98E32", fontSize: "36px", marginBottom: "5px" }}>
        {data.firstName} {data.lastName}
      </h1>

      <div style={{ color: "#D98E32", fontSize: "18px", marginBottom: "25px" }}>
        {data.jobTitle}
      </div>

      {/* PROFILE */}
      <h3 style={{ color: "#D98E32", marginBottom: "10px" }}>Profile</h3>
      <p>{data.summary}</p>

      {/* RIGHT SIDE INFO */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px" }}>
        
        <div style={{ width: "60%" }}>
          <h3 style={{ color: "#D98E32" }}>Employment History</h3>

          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginTop: "20px" }}>
              <p><b>{exp.role}</b> at {exp.company}, {exp.location}</p>
              <p style={{ fontStyle: "italic" }}>{exp.start} — {exp.end}</p>

              <ul>
                {exp.details.map((d, j) => <li key={j}>{d}</li>)}
              </ul>
            </div>
          ))}

          <h3 style={{ color: "#D98E32", marginTop: "30px" }}>Education</h3>
          {data.education.map((edu, i) => (
            <p key={i}>
              <b>{edu.school}, {edu.location}</b><br />
              {edu.degree}<br />
              {edu.start} — {edu.end}
            </p>
          ))}
        </div>

        {/* RIGHT PANEL */}
        <div style={{ width: "30%", opacity: 0.9 }}>
          <h3 style={{ color: "#6B6A6A" }}>Address</h3>
          <p>{data.address}<br />{data.city}, {data.country}</p>

          <h3 style={{ color: "#6B6A6A" }}>Email</h3>
          <p>{data.email}</p>

          <h3 style={{ color: "#6B6A6A" }}>Phone</h3>
          <p>{data.phone}</p>

          <h3 style={{ color: "#6B6A6A" }}>Skills</h3>
          <ul>
            {data.skills.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>

      </div>
    </div>
  );
};

export default TemplateBrussels;
