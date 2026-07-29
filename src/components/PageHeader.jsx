import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuIcon from "@mui/icons-material/Menu";
import { TabIcon } from "./tabIcons";

export function PageHeader({ icon, isEnglish, menuOpen = false, onBack, onMenu, parentTitle, title }) {
  return (
    <Box component="header" className="page-header">
      {onMenu && (
        <IconButton
          aria-label={isEnglish ? "Open main navigation" : "打开主导航"}
          aria-controls="mobile-navigation-drawer"
          aria-expanded={menuOpen}
          className="page-header-menu"
          onClick={onMenu}
          size="large"
        >
          <MenuIcon />
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
      {!parentTitle && icon && <TabIcon className="page-header-section-icon" name={icon} />}
      <Box className="page-header-copy" component={parentTitle ? "nav" : "div"} aria-label={parentTitle ? (isEnglish ? "Breadcrumb" : "面包屑") : undefined}>
        {parentTitle ? (
          <Box className="page-header-breadcrumb">
            <Typography component="button" onClick={onBack}>{parentTitle}</Typography>
            <Typography aria-hidden="true">›</Typography>
            <Typography aria-current="page" component="h1" title={title}>{title}</Typography>
          </Box>
        ) : (
          <Typography component="h1" title={title}>{title}</Typography>
        )}
      </Box>
    </Box>
  );
}
