import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  Calendar, Printer, RefreshCw, ShoppingCart, DollarSign,
  TrendingUp, CreditCard, Package, ArrowUpCircle, ArrowDownCircle,
  AlertCircle, CheckCircle, Clock, Users, Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCFA } from '../../utils/currency';

// ── Helpers ─────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split('T')[0];
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function paymentLabel(method) {
  const labels = { cash: 'Espèces', card: 'Carte', mobile: 'Mobile Money', credit: 'Crédit' };
  return labels[method] || method;
}

function paymentColor(method) {
  const colors = { cash: '#10b981', card: '#3b82f6', mobile: '#8b5cf6', credit: '#f59e0b' };
  return colors[method] || '#6b7280';
}

// ── Card composant ────────────────────────────────────────────────────────────

function SummaryCard({ icon: Icon, label, value, sub, color = '#3b82f6', accent }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1px solid ${accent || 'var(--color-border)'}`,
      borderLeft: `4px solid ${color}`,
      borderRadius: '10px',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '10px',
        background: color + '20',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>
          {label}
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Section container ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, color = '#3b82f6' }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '10px',
      overflow: 'hidden',
      marginBottom: '20px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: color + '10',
      }}>
        <Icon size={18} color={color} />
        <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-text)' }}>{title}</span>
      </div>
      <div style={{ padding: '16px 20px' }}>
        {children}
      </div>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ label, color = '#6b7280' }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '20px',
      background: color + '20',
      color: color,
      fontSize: '12px',
      fontWeight: 600,
    }}>
      {label}
    </span>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────

export default function DailyReportModule() {
  const { currentStore } = useApp();
  const [selectedDate, setSelectedDate] = useState(today());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    if (!currentStore?.id) {
      setError('Aucun magasin sélectionné');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/reports/daily?storeId=${currentStore.id}&date=${selectedDate}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erreur ${res.status}`);
      }
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err.message);
      toast.error('Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  }, [currentStore?.id, selectedDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrint = () => window.print();

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #daily-report-printable, #daily-report-printable * { visibility: visible !important; }
          #daily-report-printable { position: absolute; top: 0; left: 0; width: 100%; }
          #daily-report-header-actions { display: none !important; }
        }
      `}</style>

      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }} id="daily-report-printable">

        {/* ── Titre + contrôles ─────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px', marginBottom: '24px'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--color-text)' }}>
              📋 Rapport Journalier
            </h2>
            {currentStore && (
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {currentStore.name} — {new Date(selectedDate).toLocaleDateString('fr-FR', {
                  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                })}
              </div>
            )}
          </div>

          <div id="daily-report-header-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Sélecteur de date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} color="var(--color-text-secondary)" />
              <input
                type="date"
                value={selectedDate}
                max={today()}
                onChange={e => setSelectedDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Actualiser */}
            <button
              onClick={fetchReport}
              disabled={loading}
              style={{
                padding: '8px 14px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: 'var(--color-text)',
                fontSize: '14px',
              }}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              Actualiser
            </button>

            {/* Imprimer */}
            <button
              onClick={handlePrint}
              disabled={!report}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: !report ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '14px',
                opacity: !report ? 0.6 : 1,
              }}
            >
              <Printer size={15} />
              Imprimer
            </button>
          </div>
        </div>

        {/* ── États: chargement / erreur / vide ───────────────────── */}
        {loading && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: 'var(--color-text-secondary)', fontSize: '16px'
          }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
            <div>Chargement du rapport...</div>
          </div>
        )}

        {!loading && error && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: '#ef4444', fontSize: '15px'
          }}>
            <AlertCircle size={36} style={{ marginBottom: '10px' }} />
            <div>{error}</div>
          </div>
        )}

        {!loading && !error && !report && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'var(--color-text-secondary)', fontSize: '15px'
          }}>
            <Receipt size={36} style={{ marginBottom: '10px', opacity: 0.4 }} />
            <div>Aucune donnée disponible</div>
          </div>
        )}

        {/* ── Contenu du rapport ───────────────────────────────────── */}
        {!loading && report && (() => {
          const s = report.sales;
          const cs = report.cashSession;
          const cr = report.credits;
          const rt = report.returns;
          const ex = report.expenses;
          const currency = report.store?.currency || 'FCFA';

          // Bénéfice net estimé
          const netRevenue = s.total - ex.total - (cr.issued?.total || 0) + (cr.repaid?.total || 0) - rt.total;

          return (
            <>
              {/* ── 4 cartes KPI ──────────────────────────────────── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
                marginBottom: '24px',
              }}>
                <SummaryCard
                  icon={DollarSign}
                  label="Chiffre d'affaires"
                  value={formatCFA(s.total)}
                  sub={`${s.count} transaction${s.count > 1 ? 's' : ''}`}
                  color="#10b981"
                />
                <SummaryCard
                  icon={ShoppingCart}
                  label="Ticket moyen"
                  value={formatCFA(s.averageTicket)}
                  sub="par vente"
                  color="#3b82f6"
                />
                <SummaryCard
                  icon={TrendingUp}
                  label="TVA collectée"
                  value={formatCFA(s.tax)}
                  sub={`Sous-total: ${formatCFA(s.subtotal)}`}
                  color="#8b5cf6"
                />
                <SummaryCard
                  icon={Receipt}
                  label="Dépenses du jour"
                  value={formatCFA(ex.total)}
                  sub={`${ex.count} dépense${ex.count > 1 ? 's' : ''}`}
                  color="#ef4444"
                />
              </div>

              {/* ── Modes de paiement ─────────────────────────────── */}
              {Object.keys(s.byPaymentMethod).length > 0 && (
                <Section title="Ventilation par mode de paiement" icon={CreditCard} color="#3b82f6">
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '12px',
                  }}>
                    {Object.entries(s.byPaymentMethod).map(([method, data]) => (
                      <div key={method} style={{
                        padding: '14px',
                        borderRadius: '8px',
                        border: `2px solid ${paymentColor(method)}40`,
                        background: paymentColor(method) + '10',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                          {paymentLabel(method)}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: paymentColor(method) }}>
                          {formatCFA(data.total)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {data.count} vente{data.count > 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* ── Session de caisse ─────────────────────────────── */}
              {cs ? (
                <Section title={`Session de caisse N° ${cs.sessionNumber}`} icon={DollarSign} color="#f59e0b">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    {[
                      { label: 'Ouverture', value: formatCFA(cs.openingAmount), icon: ArrowUpCircle, color: '#10b981' },
                      { label: 'Fermeture', value: cs.closingAmount != null ? formatCFA(cs.closingAmount) : '(ouverte)', icon: ArrowDownCircle, color: '#6b7280' },
                      { label: 'Montant attendu', value: cs.expectedAmount != null ? formatCFA(cs.expectedAmount) : '—', icon: TrendingUp, color: '#3b82f6' },
                      {
                        label: 'Écart',
                        value: cs.difference != null ? formatCFA(Math.abs(cs.difference)) : '—',
                        icon: cs.difference > 0 ? ArrowUpCircle : AlertCircle,
                        color: cs.difference == null ? '#6b7280' : cs.difference === 0 ? '#10b981' : cs.difference > 0 ? '#10b981' : '#ef4444',
                        sub: cs.difference > 0 ? '(surplus)' : cs.difference < 0 ? '(manque)' : cs.difference === 0 ? '(équilibré)' : null
                      },
                    ].map(({ label, value, icon: Icon2, color: c, sub }) => (
                      <div key={label} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'var(--color-surface-hover)',
                      }}>
                        <Icon2 size={18} color={c} />
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{label}</div>
                          <div style={{ fontWeight: 700, color: c }}>{value}{sub ? ` ${sub}` : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    <span><b>Ouvert par:</b> {cs.openedBy}</span>
                    {cs.closedBy && <span><b>Fermé par:</b> {cs.closedBy}</span>}
                    <span><b>Ouvert à:</b> {fmtDate(cs.openedAt)}</span>
                    {cs.closedAt && <span><b>Fermé à:</b> {fmtDate(cs.closedAt)}</span>}
                    <span>
                      <Badge
                        label={cs.status === 'open' ? 'En cours' : 'Fermée'}
                        color={cs.status === 'open' ? '#10b981' : '#6b7280'}
                      />
                    </span>
                  </div>
                  {cs.notes && (
                    <div style={{ marginTop: '10px', fontSize: '13px', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                      Notes: {cs.notes}
                    </div>
                  )}
                </Section>
              ) : (
                <Section title="Session de caisse" icon={DollarSign} color="#6b7280">
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', textAlign: 'center', padding: '10px 0' }}>
                    Aucune session de caisse enregistrée pour ce jour.
                  </div>
                </Section>
              )}

              {/* ── Top 10 produits ───────────────────────────────── */}
              {s.topProducts.length > 0 && (
                <Section title="Top produits vendus" icon={Package} color="#8b5cf6">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-surface-hover)' }}>
                        {['#', 'Produit', 'Qté', 'Total'].map(h => (
                          <th key={h} style={{
                            padding: '8px 10px', textAlign: h === 'Total' || h === 'Qté' ? 'right' : 'left',
                            fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '12px',
                            borderBottom: '1px solid var(--color-border)'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.topProducts.map((p, i) => (
                        <tr key={p.name} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '8px 10px', color: 'var(--color-text-secondary)', width: '30px' }}>
                            {i + 1}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: i < 3 ? 600 : 400 }}>
                            {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}{p.name}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{p.quantity}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                            {formatCFA(p.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Section>
              )}

              {/* ── Crédits ───────────────────────────────────────── */}
              <Section title="Crédits" icon={Users} color="#f59e0b">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* Accordés */}
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#ef4444' }}>
                      ↑ Crédits accordés ({cr.issued.count}) — {formatCFA(cr.issued.total)}
                    </div>
                    {cr.issued.items.length === 0 ? (
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Aucun crédit accordé</div>
                    ) : (
                      cr.issued.items.map((item, idx) => (
                        <div key={idx} style={{
                          padding: '8px 10px', borderRadius: '6px',
                          background: '#ef444410', marginBottom: '6px', fontSize: '13px'
                        }}>
                          <div style={{ fontWeight: 600 }}>{item.customer}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                            <span>{formatCFA(item.amount)}</span>
                            <span>Échéance: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('fr-FR') : '—'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Remboursés */}
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#10b981' }}>
                      ↓ Remboursements reçus ({cr.repaid.count}) — {formatCFA(cr.repaid.total)}
                    </div>
                    {cr.repaid.items.length === 0 ? (
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Aucun remboursement</div>
                    ) : (
                      cr.repaid.items.map((item, idx) => (
                        <div key={idx} style={{
                          padding: '8px 10px', borderRadius: '6px',
                          background: '#10b98110', marginBottom: '6px', fontSize: '13px'
                        }}>
                          <div style={{ fontWeight: 600 }}>{item.customer}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                            <span>{formatCFA(item.amount)}</span>
                            <span>{fmtDate(item.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Section>

              {/* ── Retours ───────────────────────────────────────── */}
              {rt.count > 0 && (
                <Section title={`Retours (${rt.count}) — ${formatCFA(rt.total)}`} icon={ArrowDownCircle} color="#ef4444">
                  {rt.items.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px'
                    }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{formatCFA(item.amount)}</span>
                        <span style={{ color: 'var(--color-text-secondary)', marginLeft: '8px' }}>{item.reason}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Badge label={item.refundMethod || '—'} color="#ef4444" />
                        <span style={{ color: 'var(--color-text-secondary)' }}>{item.processedBy}</span>
                      </div>
                    </div>
                  ))}
                </Section>
              )}

              {/* ── Dépenses ──────────────────────────────────────── */}
              {ex.count > 0 && (
                <Section title={`Dépenses (${ex.count}) — ${formatCFA(ex.total)}`} icon={ArrowUpCircle} color="#6366f1">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-surface-hover)' }}>
                        {['Catégorie', 'Description', 'Montant', 'Par', 'Heure'].map(h => (
                          <th key={h} style={{
                            padding: '7px 10px', textAlign: h === 'Montant' ? 'right' : 'left',
                            fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '12px',
                            borderBottom: '1px solid var(--color-border)'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ex.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '7px 10px' }}>
                            <Badge label={item.category} color="#6366f1" />
                          </td>
                          <td style={{ padding: '7px 10px', color: 'var(--color-text-secondary)' }}>{item.description}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{formatCFA(item.amount)}</td>
                          <td style={{ padding: '7px 10px', color: 'var(--color-text-secondary)' }}>{item.createdBy}</td>
                          <td style={{ padding: '7px 10px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                            {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Section>
              )}

              {/* ── Bilan récapitulatif ───────────────────────────── */}
              <Section title="Bilan de la journée" icon={CheckCircle} color="#10b981">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  {[
                    { label: 'Ventes brutes', value: formatCFA(s.total), color: '#10b981' },
                    { label: 'Crédits accordés', value: `- ${formatCFA(cr.issued.total)}`, color: '#ef4444' },
                    { label: 'Remboursements', value: `+ ${formatCFA(cr.repaid.total)}`, color: '#10b981' },
                    { label: 'Retours', value: `- ${formatCFA(rt.total)}`, color: '#ef4444' },
                    { label: 'Dépenses', value: `- ${formatCFA(ex.total)}`, color: '#ef4444' },
                    { label: 'Net estimé', value: formatCFA(netRevenue), color: netRevenue >= 0 ? '#10b981' : '#ef4444', bold: true },
                  ].map(row => (
                    <div key={row.label} style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'var(--color-surface-hover)',
                      display: 'flex', flexDirection: 'column', gap: '2px',
                    }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{row.label}</span>
                      <span style={{ fontWeight: row.bold ? 700 : 600, fontSize: row.bold ? '17px' : '15px', color: row.color }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>

            </>
          );
        })()}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </>
  );
}
