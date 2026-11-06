import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GisMap from './GisMap'
import { riskStyle } from '../utils/format'

const RISK_LEVELS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

function hasValidCoordinates(project) {
  if (project.latitude == null || project.longitude == null) return false
  const latitude = Number(project.latitude)
  const longitude = Number(project.longitude)
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

/** India-wide, RBAC-scoped view of works with recorded coordinates. */
export default function GeospatialRiskMap({ projects = [] }) {
  const navigate = useNavigate()
  const [risk, setRisk] = useState('ALL')
  const [category, setCategory] = useState('ALL')
  const [mapUnavailable, setMapUnavailable] = useState(false)

  const categories = useMemo(
    () =>
      [...new Set(projects.map((project) => project.sector).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [projects],
  )

  const points = useMemo(
    () =>
      projects
        .filter(
          (project) =>
            hasValidCoordinates(project) &&
            (risk === 'ALL' || project.risk_level === risk) &&
            (category === 'ALL' || project.sector === category),
        )
        .map((project) => ({
          id: project.project_id,
          name: project.project_name,
          lat: project.latitude,
          lon: project.longitude,
          level: project.risk_level,
          score: project.risk_score,
          category: project.sector || project.work_type,
        })),
    [projects, risk, category],
  )

  const openProject = useCallback(
    (point) => navigate(`/projects/${encodeURIComponent(point.id)}`),
    [navigate],
  )
  const markUnavailable = useCallback(() => setMapUnavailable(true), [])

  const clearFilters = () => {
    setRisk('ALL')
    setCategory('ALL')
  }

  return (
    <section className="panel overflow-hidden">
      <div className="panel-header">
        <div>
          <h3 className="panel-title">Geospatial risk map</h3>
          <p className="mt-0.5 text-2xs text-ink-500">
            Synthetic demonstration works with recorded coordinates
          </p>
        </div>
        <span className="tnum text-2xs text-ink-500">
          {points.length} mapped work{points.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-ink-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Map risk filter">
          {RISK_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setRisk(level)}
              aria-pressed={risk === level}
              className={`rounded border px-2 py-1 text-2xs font-semibold uppercase tracking-wide transition-colors ${
                risk === level
                  ? 'border-ink-800 bg-ink-800 text-white'
                  : 'border-ink-300 bg-white text-ink-600 hover:bg-ink-50'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="min-w-[13rem]">
          <label htmlFor="map-category" className="sr-only">
            Filter map by project category
          </label>
          <select
            id="map-category"
            className="input py-1.5 text-[13px]"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="ALL">All project categories</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {(risk !== 'ALL' || category !== 'ALL') && (
          <button type="button" className="link text-2xs" onClick={clearFilters}>
            Clear map filters
          </button>
        )}
      </div>

      <div className="p-4">
        {mapUnavailable ? (
          <div className="rounded border border-ink-200 bg-ink-50 px-3 py-8 text-center">
            <p className="text-[13px] text-ink-600">
              The basemap is unavailable on this network. The works register below remains available.
            </p>
          </div>
        ) : (
          <GisMap
            key={`${risk}:${category}`}
            points={points}
            height={420}
            mode="portfolio"
            onMarkerClick={openProject}
            onUnavailable={markUnavailable}
          />
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Risk marker legend">
            {RISK_LEVELS.slice(1).map((level) => (
              <span key={level} className="flex items-center gap-1.5 text-2xs text-ink-600">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: riskStyle(level).hex }}
                />
                {level.charAt(0) + level.slice(1).toLowerCase()}
              </span>
            ))}
          </div>
          <p className="text-2xs text-ink-400">Select a marker to open the project details page.</p>
        </div>
      </div>
    </section>
  )
}
