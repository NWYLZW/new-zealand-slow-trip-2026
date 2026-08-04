import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuIcon from "@mui/icons-material/Menu";
import { TabIcon } from "./tabIcons";

export function PageHeader({ actions, breadcrumbs, icon, isEnglish, menuOpen = false, onBack, onMenu, parentTitle, title }) {
  const breadcrumbItems = breadcrumbs?.length
    ? breadcrumbs
    : parentTitle
      ? [{ label: parentTitle, onClick: onBack }, { current: true, label: title }]
      : null;
  return (
    <Box component="header" className="page-header">
      {onMenu && (
        <IconButton
          aria-label={isEnglish ? "Open main navigation" : "打开主导航"}
          aria-controls="mobile-navigation-drawer"
          aria-expanded={menuOpen}
          className="page-header-menu"
          onClick={onMenu}
          size="small"
        >
          <MenuIcon fontSize="small" />
        </IconButton>
      )}
      {onBack && (
        <IconButton
          aria-label={isEnglish ? "Back to parent page" : "返回上一级"}
          className="page-header-back"
          onClick={onBack}
          size="small"
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
      )}
      {!breadcrumbItems && icon && <TabIcon className="page-header-section-icon" name={icon} />}
      <Box className="page-header-copy" component={breadcrumbItems ? "nav" : "div"} aria-label={breadcrumbItems ? (isEnglish ? "Breadcrumb" : "面包屑") : undefined}>
        {breadcrumbItems ? (
          <Box className="page-header-breadcrumb">
            {breadcrumbItems.map((item, index) => (
              <Box className="page-header-breadcrumb-item" key={`${item.label}-${index}`}>
                {index > 0 && <Typography aria-hidden="true" className="page-header-breadcrumb-separator">›</Typography>}
                <Typography
                  aria-current={item.current ? "page" : undefined}
                  className={item.current ? "is-current" : undefined}
                  component="button"
                  onClick={item.onClick}
                  title={item.label}
                  type="button"
                >{item.label}</Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography component="h1" title={title}>{title}</Typography>
        )}
      </Box>
      {actions && <Box className="page-header-actions">{actions}</Box>}
    </Box>
  );
}
