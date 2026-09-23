'use client';

import { useState, useEffect } from 'react';
import { Search, Users, BookOpen, CheckCircle, XCircle, Loader2, Plus } from 'lucide-react';
import { schoolConfig } from '@/lib/school-config';
import { StudyPodMatcherSkeleton, MatchCardSkeleton } from './Skeleton';

interface StudyPodMatcherProps {
  userLocation: [number, number] | null;
  isLoading?: boolean;
}

export default function StudyPodMatcher({ userLocation, isLoading = false }: StudyPodMatcherProps) {
  const [courseCode, setCourseCode] = useState('');
  const [topic, setTopic] = useState('');
  const [strongSkills, setStrongSkills] = useState<string[]>([]);
  const [neededSkills, setNeededSkills] = useState<string[]>([]);
  const [buildingLocation, setBuildingLocation] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSkill = (skill: string, type: 'strong' | 'needed') => {
    const skills = type === 'strong' ? strongSkills : neededSkills;
    if (!skills.includes(skill) && skills.length < 5) {
      if (type === 'strong') setStrongSkills([...skills, skill]);
      else setNeededSkills([...skills, skill]);
    }
  };

  const handleRemoveSkill = (skill: string, type: 'strong' | 'needed') => {
    if (type === 'strong') setStrongSkills(strongSkills.filter(s => s !== skill));
    else setNeededSkills(neededSkills.filter(s => s !== skill));
  };

  const handleSearch = async () => {
    if (!courseCode.trim()) {
      setError('Please enter a course code');
      return;
    }
    if (!userLocation) {
      setError('Location access required');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/pods/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_code: courseCode,
          user_skills: strongSkills,
          needed_skills: neededSkills,
          lat: userLocation[0],
          lng: userLocation[1],
          radius_meters: 1000,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to find matches');
      }

      setMatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreatePod = async () => {
    if (!courseCode.trim() || !topic.trim() || !buildingLocation.trim()) {
      setError('Please fill all required fields');
      return;
    }
    if (!userLocation) {
      setError('Location access required');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/pods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_code: courseCode,
          topic: topic,
          strong_skills: strongSkills,
          needed_skills: neededSkills,
          building_location: buildingLocation,
          max_capacity: schoolConfig.defaultPodCapacity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create pod');
      }

      setShowCreate(false);
      setTopic('');
      setBuildingLocation('');
      setStrongSkills([]);
      setNeededSkills([]);
      // Refresh matches
      await handleSearch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinPod = async (podId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/pods/${podId}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to join');
      }

      // Refresh matches
      await handleSearch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join');
    }
  };

  if (isLoading) {
    return <StudyPodMatcherSkeleton />;
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" style={{ color: schoolConfig.primaryColor }} />
          <h2 className="text-lg font-semibold text-gray-900">Study Pod Matcher</h2>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-sm font-medium flex items-center gap-1"
          style={{ color: schoolConfig.primaryColor }}
        >
          <Plus className="w-4 h-4" />
          {showCreate ? 'Cancel' : 'Create Pod'}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search Form / Create Form */}
        {showCreate ? (
          <CreatePodForm
            courseCode={courseCode}
            setCourseCode={setCourseCode}
            topic={topic}
            setTopic={setTopic}
            strongSkills={strongSkills}
            setStrongSkills={setStrongSkills}
            neededSkills={neededSkills}
            setNeededSkills={setNeededSkills}
            buildingLocation={buildingLocation}
            setBuildingLocation={setBuildingLocation}
            onSubmit={handleCreatePod}
            isSubmitting={isCreating}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
          />
        ) : (
          <SearchPodForm
            courseCode={courseCode}
            setCourseCode={setCourseCode}
            strongSkills={strongSkills}
            setStrongSkills={setStrongSkills}
            neededSkills={neededSkills}
            setNeededSkills={setNeededSkills}
            onSearch={handleSearch}
            isSearching={isSearching}
            userLocation={userLocation}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
          />
        )}

        {/* Results */}
        {!showCreate && (
          <div className="space-y-3">
            {matches.length === 0 && !isSearching && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="font-medium">No matching pods found</p>
                <p className="text-sm mt-1">Create a new pod to start a study group!</p>
              </div>
            )}
            
            {isSearching && (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Finding compatible pods...
              </div>
            )}

            {matches.map((match) => (
              <MatchCard
                key={match.pod.id}
                match={match}
                onJoin={handleJoinPod}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchPodForm({
  courseCode,
  setCourseCode,
  strongSkills,
  setStrongSkills,
  neededSkills,
  setNeededSkills,
  onSearch,
  isSearching,
  userLocation,
  onAddSkill,
  onRemoveSkill,
}: any) {
  return (
    <div className="space-y-4">
      {/* Course Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
            placeholder="e.g., CS 101, MATH 201"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all text-uppercase"
            list="course-suggestions"
            maxLength={20}
          />
          <datalist id="course-suggestions">
            {schoolConfig.courses.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
      </div>

      {/* Skills */}
      <div className="grid grid-cols-2 gap-4">
        <SkillInput
          label="You're Good At"
          skills={strongSkills}
          onAdd={onAddSkill}
          onRemove={onRemoveSkill}
          suggestions={schoolConfig.skills}
          type="strong"
        />
        <SkillInput
          label="You Need Help With"
          skills={neededSkills}
          onAdd={onAddSkill}
          onRemove={onRemoveSkill}
          suggestions={schoolConfig.skills}
          type="needed"
        />
      </div>

      {/* Search Button */}
      <button
        onClick={onSearch}
        disabled={isSearching || !courseCode.trim()}
        className="w-full py-3 px-4 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: schoolConfig.primaryColor }}
      >
        {isSearching ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Find Matching Pods
          </>
        )}
      </button>

      {userLocation && (
        <p className="text-xs text-gray-500 text-center">
          Searching within 1km of your location
        </p>
      )}
    </div>
  );
}

function CreatePodForm({
  courseCode,
  setCourseCode,
  topic,
  setTopic,
  strongSkills,
  setStrongSkills,
  neededSkills,
  setNeededSkills,
  buildingLocation,
  setBuildingLocation,
  onSubmit,
  isSubmitting,
  onAddSkill,
  onRemoveSkill,
}: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
        <input
          type="text"
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
          placeholder="e.g., CS 101"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all text-uppercase"
          list="course-suggestions"
          maxLength={20}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Topic / Focus</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Midterm Review, Project Help, Concept Clarification"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          maxLength={100}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SkillInput
          label="You're Good At"
          skills={strongSkills}
          onAdd={onAddSkill}
          onRemove={onRemoveSkill}
          suggestions={schoolConfig.skills}
          type="strong"
        />
        <SkillInput
          label="You Need Help With"
          skills={neededSkills}
          onAdd={onAddSkill}
          onRemove={onRemoveSkill}
          suggestions={schoolConfig.skills}
          type="needed"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Building / Location</label>
        <input
          type="text"
          value={buildingLocation}
          onChange={(e) => setBuildingLocation(e.target.value)}
          placeholder="e.g., Library 2nd Floor, Engineering Building Room 101"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          maxLength={100}
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full py-3 px-4 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: schoolConfig.secondaryColor }}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            Create Study Pod
          </>
        )}
      </button>
    </div>
  );
}

function SkillInput({
  label,
  skills,
  onAdd,
  onRemove,
  suggestions,
  type,
}: any) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const filtered = suggestions.filter((s: string) => 
    s.toLowerCase().includes(inputValue.toLowerCase()) && !skills.includes(s)
  );

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      
      {/* Current Skills */}
      <div className="flex flex-wrap gap-1 mb-2 min-h-[28px]">
        {skills.map((skill: string) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: type === 'strong' ? '#dbeafe' : '#fef3c7',
              color: type === 'strong' ? '#1e40af' : '#92400e'
            }}
          >
            {skill}
            <button
              onClick={() => onRemove(skill, type)}
              className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/10"
            >
              <XCircle className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Add Skill Input */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue.trim() && !skills.includes(inputValue.trim())) {
              e.preventDefault();
              onAdd(inputValue.trim(), type);
              setInputValue('');
            }
          }}
          placeholder="Add skill..."
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all text-sm"
        />
        
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {filtered.map((skill: string) => (
              <button
                key={skill}
                onClick={() => {
                  onAdd(skill, type);
                  setInputValue('');
                  setShowSuggestions(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
              >
                {skill}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match, onJoin }: any) {
  const { pod, match_score, matching_skills, missing_skills } = match;
  const scorePercent = Math.round(match_score * 100);

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{pod.course_code}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {scorePercent}% Match
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{pod.topic}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {pod.current_count}/{pod.max_capacity}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {pod.building_location}
            </span>
          </div>

          {/* Matching Skills */}
          {(matching_skills.length > 0 || missing_skills.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-1">
              {matching_skills.slice(0, 3).map((skill: string) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700"
                >
                  ✓ {skill}
                </span>
              ))}
              {missing_skills.slice(0, 2).map((skill: string) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700"
                >
                  + {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onJoin(pod.id)}
          disabled={pod.current_count >= pod.max_capacity}
          className="px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          style={{ 
            backgroundColor: pod.current_count >= pod.max_capacity ? '#9ca3af' : schoolConfig.secondaryColor,
            color: 'white'
          }}
        >
          {pod.current_count >= pod.max_capacity ? 'Full' : 'Join'}
        </button>
      </div>
    </div>
  );
}