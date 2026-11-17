"use client";

import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { EASE, VIEWPORT } from "../motion/motion";
import type { Dictionary, ServiceId } from "../../content/dictionary";
import styles from "./ServiceExplorer.module.css";

const illustrations: Record<ServiceId, ReactNode> = {
  web: (
    <span className={styles.browserStack}>
      <span className={styles.browserBack} />
      <span className={styles.browserMiddle} />
      <span className={styles.browserFront}>
        <span className={styles.browserToolbar}><i /><i /><i /><span /></span>
        <span className={styles.browserPage}>
          <span className={styles.browserSidebar}><i /><i /><i /></span>
          <span className={styles.browserContent}>
            <span className={styles.browserImage} />
            <span className={styles.browserLines}><i /><i /><i /></span>
          </span>
        </span>
      </span>
    </span>
  ),
  mobile: (
    <span className={styles.mobileScene}>
      <span className={styles.phone}>
        <span className={styles.phoneCamera} />
        <span className={styles.phoneScreen}><i /><i /><i /></span>
        <span className={styles.phoneHome} />
      </span>
      <span className={styles.pass}>
        <span className={styles.passHeading}><i /><span /></span>
        <span className={styles.passStamps}><i /><i /><i /><i /><i /></span>
        <span className={styles.barcode} />
      </span>
    </span>
  ),
  integration: (
    <span className={styles.network}>
      <span className={styles.connectorTop} />
      <span className={styles.connectorBottom} />
      <span className={styles.connectorCenter} />
      <span className={`${styles.networkNode} ${styles.nodeTopLeft}`}><i /><i /><i /></span>
      <span className={`${styles.networkNode} ${styles.nodeTopRight}`}><i /><i /><i /></span>
      <span className={`${styles.networkNode} ${styles.nodeBottomLeft}`}><i /><i /><i /></span>
      <span className={`${styles.networkNode} ${styles.nodeBottomRight}`}><i /><i /><i /></span>
      <span className={styles.networkHub}><i /><i /><i /></span>
    </span>
  ),
  environments: (
    <span className={styles.assembly}>
      <span className={styles.assemblyBase} />
      <span className={`${styles.module} ${styles.moduleWeb}`}><i /><i /></span>
      <span className={`${styles.module} ${styles.moduleApp}`}><i /></span>
      <span className={`${styles.module} ${styles.moduleData}`}><i /><i /><i /></span>
      <span className={`${styles.module} ${styles.moduleFlow}`}><i /><i /><i /></span>
    </span>
  ),
};

export function ServiceExplorer({ t }: { t: Dictionary["services"] }) {
  const [openId, setOpenId] = useState<ServiceId | null>(null);

  return (
    <ul className={styles.grid}>
      {t.items.map((service, index) => {
        const open = openId === service.id;
        const triggerId = `service-${service.id}`;
        const panelId = `${triggerId}-details`;

        return (
          <motion.li key={service.id} className={styles.service + " motion-reduce:transform-none!"} initial={{ scale: 0.94, y: 16 }} whileInView={{ scale: 1, y: 0 }} viewport={VIEWPORT} transition={{ duration: 0.6, delay: index % 2 * 0.1, ease: EASE }}>
            <h3>
              <button
                id={triggerId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                className={styles.trigger}
                onClick={() => setOpenId((current) => current === service.id ? null : service.id)}
              >
                <span aria-hidden="true" className={styles.illustration}>{illustrations[service.id]}</span>
                <span className={styles.name}>{service.name}</span>
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!open} className={styles.details}>
              <dl>
                <div><dt>{t.details.includes}</dt><dd>{service.description}</dd></div>
                <div><dt>{t.details.when}</dt><dd>{service.when}</dd></div>
                <div><dt>{t.details.example}</dt><dd>{service.example}</dd></div>
              </dl>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
