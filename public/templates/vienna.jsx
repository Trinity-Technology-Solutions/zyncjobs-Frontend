import React from "react";

const TemplateVienna = ({ data }) => {
  return (
    <div style={{ fontFamily: "Inter", maxWidth: "900px", margin: "auto" }}>

      {/* GREEN HEADER */}
      <div style={{
        background: "#19C38A",
        color: "#fff",
        padding: "30px",
        display: "flex",
        alignItems: "center",
        gap: "20px"
      }}>
        
        <div style={{ width: "120px", height: "120px", borderRadius: "8px", overflow: "hidden" }}>
          <img src={data.photoURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div>
          <h1 style={{ margin: 0 }}>{data.firstName} {data.lastName}</h1>
          <p>{data.jobTitle}</p>
          <p>{data.address}, {data.city}</p>
          <p>{data.phone} — {data.email}</p>
        </div>

      </div>

      <div style={{ display: "grid", gridTemplateColumns: "30% 70%" }}>

        {/* SIDEBAR */}
        <div style={{ padding: "30px" }}>
          
          <h3>Skills</h3>
          <ul>
            {data.skills.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h3>Languages</h3>
          <ul>
            {data.languages.map((l, i) => <li key={i}>{l}</li>)}
          </ul>

        </div>

        {/* MAIN CONTENT */}
        <div style={{ padding: "30px" }}>
          
          <h3>Profile</h3>
          <p>{data.summary}</p>

          <h3>Employment History</h3>
          {data.experience.map((exp, i) => (
            <div key={i}>
              <p><b>{exp.role}</b> at {exp.company}, {exp.location}</p>
              <p>{exp.start} — {exp.end}</p>
              <ul>
                {exp.details.map((d, j) => <li key={j}>{d}</li>)}
              </ul>
            </div>
          ))}

          <h3>Education</h3>
          {data.education.map((edu, i) => (
            <p key={i}>
              <b>{edu.degree}</b><br />
              {edu.school}, {edu.location}<br />
              {edu.start} — {edu.end}
            </p>
          ))}

        </div>

      </div>

    </div>
  );
};

export default TemplateVienna;
