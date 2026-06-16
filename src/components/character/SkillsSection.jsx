// components/character/SkillsSection.jsx

export default function SkillsSection({ skills, onRoll }) {
  return (
    <div className="bg-wasteland-800 p-4 rounded-lg border border-wasteland-600">
      <h3 className="text-wasteland-300 font-stylized mb-3">Навыки</h3>
      <div className="grid grid-cols-2 gap-2">
        {skills.map(skill => (
          <button
            key={skill.id}
            onClick={() => onRoll(skill.name)}
            className="bg-wasteland-700 p-3 rounded text-left hover:bg-wasteland-600 hover:border-wasteland-500 border border-transparent transition active:scale-95"
          >
            <div className="flex justify-between items-center">
              <span className="text-wasteland-200 text-sm">{skill.name}</span>
              <span className="text-sm font-bold text-accent-green">+{skill.totalModifier || 0}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
