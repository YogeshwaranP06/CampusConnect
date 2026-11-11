import React, { useState } from 'react';
import { CampusInternship } from '../../types/internship';
import { InternshipCard } from './InternshipCard';
import { SRM_TRP_DEPARTMENTS } from '../../utils/validation';
import { Search, GraduationCap, Briefcase } from 'lucide-react';

interface OpportunitiesViewProps {
  internships: CampusInternship[];
  savedIds: string[];
  onToggleSave: (internshipId: string, e?: React.MouseEvent) => void;
  onSelectInternship?: (internship: CampusInternship) => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  internships = [],
  savedIds = [],
  onToggleSave,
  onSelectInternship,
}) => {
  const [opportunityType, setOpportunityType] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredInternships = internships.filter((item) => {
    if (!item) return false;

    // Filter by Tab / Opportunity Type
    if (opportunityType !== 'all') {
      const cat = (item.category || '').toLowerCase();
      const type = (item.internship_type || '').toLowerCase();
      const stipendDesc = (item.stipend_details || '').toLowerCase();
      const stipendVal = typeof item.stipend_amount === 'number' ? item.stipend_amount : 0;

      if (opportunityType === 'paid') {
        const isPaid =
          stipendVal > 0 ||
          stipendDesc.includes('₹') ||
          stipendDesc.includes('/mo') ||
          (stipendDesc.length > 0 && !stipendDesc.includes('unpaid'));
        if (!isPaid) return false;
      } else if (opportunityType === 'fellowships') {
        const isFellowship =
          cat.includes('fellowship') ||
          type.includes('fellowship') ||
          type.includes('r&d') ||
          cat.includes('research');
        if (!isFellowship) return false;
      } else if (opportunityType === 'training') {
        const isTraining =
          cat.includes('training') ||
          type.includes('training') ||
          type.includes('industrial');
        if (!isTraining) return false;
      }
    }

    // Filter by Academic Department
    if (departmentFilter !== 'all') {
      const targetDept = departmentFilter.toLowerCase();
      const eligDepts = (item.eligible_departments || '').toLowerCase();
      const dept = (item.department || '').toLowerCase();
      const elig = (item.eligibility || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      const rawTags = Array.isArray(item.tags) ? item.tags.join(' ') : (item.tags || '');
      const fullText = `${eligDepts} ${dept} ${elig} ${desc} ${name} ${rawTags}`.toLowerCase();

      const allowsAll =
        eligDepts.includes('all') ||
        elig.includes('all students') ||
        elig.includes('all branches') ||
        elig.includes('open to all') ||
        elig.includes('any engineering');

      if (!allowsAll) {
        let match = false;
        if (targetDept.includes('civil') && fullText.includes('civil')) match = true;
        else if (
          (targetDept.includes('computer science') || targetDept.includes('cse')) &&
          (fullText.includes('computer') || fullText.includes('cs') || fullText.includes('cse') || fullText.includes('software'))
        ) match = true;
        else if (
          (targetDept.includes('electronics and communication') || targetDept.includes('ece')) &&
          (fullText.includes('ece') || fullText.includes('electronics') || fullText.includes('communication'))
        ) match = true;
        else if (
          (targetDept.includes('electrical and electronics') || targetDept.includes('eee')) &&
          (fullText.includes('eee') || fullText.includes('electrical'))
        ) match = true;
        else if (targetDept.includes('mechanical') && (fullText.includes('mech') || fullText.includes('mechanical'))) match = true;
        else if (
          (targetDept.includes('artificial intelligence and data science') || targetDept.includes('ai&ds')) &&
          (fullText.includes('ai') || fullText.includes('data science') || fullText.includes('artificial intelligence'))
        ) match = true;
        else if (
          (targetDept.includes('artificial intelligence and machine learning') || targetDept.includes('aiml')) &&
          (fullText.includes('ai') || fullText.includes('machine learning') || fullText.includes('aiml'))
        ) match = true;
        else if (targetDept.includes('vlsi') && fullText.includes('vlsi')) match = true;
        else if (targetDept.includes('thermal') && fullText.includes('thermal')) match = true;
        else if (
          targetDept.includes('mba') &&
          (fullText.includes('mba') || fullText.includes('business administration') || fullText.includes('management'))
        ) match = true;
        else if (fullText.includes(targetDept)) match = true;

        if (!match) return false;
      }
    }

    // Search Query Filtering
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = (item.name || '').toLowerCase();
      const org = (item.organizer_name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const elig = (item.eligibility || '').toLowerCase();
      const roleType = (item.internship_type || '').toLowerCase();

      return (
        name.includes(q) ||
        org.includes(q) ||
        desc.includes(q) ||
        elig.includes(q) ||
        roleType.includes(q)
      );
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-transparent">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 block">
          SRM TRP Career Development &amp; Placements
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-light text-[#111827] tracking-tight">
          Internships, Research Fellowships &amp; Industrial Training
        </h1>
        <p className="text-sm text-[#475569] leading-relaxed font-normal">
          Verified industry internships, funded research fellowships, corporate recruitment drives, and hands-on industrial training curated for SRM TRP students.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        {/* Left: Type Switcher & Department Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Type Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200 overflow-x-auto">
            <button
              type="button"
              onClick={() => setOpportunityType('all')}
              className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer ${
                opportunityType === 'all'
                  ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#111827]'
              }`}
            >
              All Opportunities
            </button>
            <button
              type="button"
              onClick={() => setOpportunityType('paid')}
              className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer ${
                opportunityType === 'paid'
                  ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#111827]'
              }`}
            >
              Paid Stipend
            </button>
            <button
              type="button"
              onClick={() => setOpportunityType('fellowships')}
              className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer ${
                opportunityType === 'fellowships'
                  ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#111827]'
              }`}
            >
              Research Fellowships
            </button>
            <button
              type="button"
              onClick={() => setOpportunityType('training')}
              className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer ${
                opportunityType === 'training'
                  ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                  : 'text-[#475569] hover:text-[#111827]'
              }`}
            >
              Industrial Training
            </button>
          </div>

          {/* Department Filter Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-[#111827]">
            <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-[#111827] focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">All Departments</option>
              {SRM_TRP_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search role, skills, or company..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-[#111827] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredInternships.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 mb-3">
            <Briefcase className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="font-serif text-lg font-normal text-[#111827]">
            No internship opportunities match this filter
          </p>
          <p className="text-xs text-[#475569] max-w-sm mx-auto">
            Try switching to "All Opportunities" or reset your department filter to view all verified campus drives.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInternships.map((internship) => {
            const cardId = internship.internship_id || internship.id;
            return (
              <InternshipCard
                key={cardId}
                internship={internship}
                onSelect={onSelectInternship}
                isSaved={savedIds.includes(cardId)}
                onToggleSave={(id, e) => onToggleSave(id, e)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
