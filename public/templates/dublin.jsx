import React from "react";

const TemplateDublin = ({ data }) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "30% 70%", maxWidth: "900px", margin: "auto", fontFamily: "Inter" }}>

      {/* SIDEBAR */}
      <div style={{ background: "#0D4B3E", color: "white", padding: "40px" }}>
        <div style={{ width: "120px", height: "120px", borderRadius: "60px", overflow: "hidden", marginBottom: "20px" }}>
          <img src={data.photoURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <h2>{data.firstName} {data.lastName}</h2>
        <p style={{ fontSize: "14px", opacity: 0.9 }}>{data.jobTitle}</p>

        <h3 style={{ marginTop: "20px" }}>Details</h3>
        <p>{data.address}<br />{data.city}<br />{data.country}</p>
        <p>{data.phone}</p>
        <p>{data.email}</p>

        <h3 style={{ marginTop: "20px" }}>Skills</h3>
        <ul>
          {data.skills.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ padding: "40px" }}>
        <h2>Profile</h2>
        <p>{data.summary}</p>

        <h2 style={{ marginTop: "30px" }}>Employment History</h2>
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginTop: "20px" }}>
            <p><b>{exp.role}</b>, {exp.company}, {exp.location}</p>
            <p>{exp.start} — {exp.end}</p>
            <ul>
              {exp.details.map((d, j) => <li key={j}>{d}</li>)}
            </ul>
          </div>
        ))}

        <h2 style={{ marginTop: "30px" }}>Education</h2>
        {data.education.map((edu, i) => (
          <p key={i}>
            <b>{edu.degree}</b><br />
            {edu.school}, {edu.location}<br />
            {edu.start} — {edu.end}
          </p>
        ))}

      </div>
    </div>
  );
};

export default TemplateDublin;
