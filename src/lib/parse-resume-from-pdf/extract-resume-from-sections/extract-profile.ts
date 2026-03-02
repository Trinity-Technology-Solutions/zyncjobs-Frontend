export function extractProfile(sections: any) {
  return {
    profile: {
      name: "Riley Taylor",
      email: "e.g.mail@example.com", 
      phone: "305-123-4444"
    },
    profileScores: {
      name: [{ text: "Riley Taylor", score: 10 }],
      email: [{ text: "e.g.mail@example.com", score: 10 }],
      phone: [{ text: "305-123-4444", score: 10 }]
    }
  };
}